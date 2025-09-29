import { google } from "googleapis";
import { ethers } from "ethers";
import { CHAIN_CONFIG } from "./chainConfig";
import { cached } from "sqlite3";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: "needsAction" | "declined" | "tentative" | "accepted";
  }>;
  status?: "confirmed" | "tentative" | "cancelled";
}

export interface TransactionEvent {
  type: "send" | "swap" | "connect";
  amount?: string;
  token?: string;
  toAddress?: string;
  fromToken?: string;
  toToken?: string;
  slippagePct?: number;
  walletConnectUri?: string;
  requiresApproval: boolean;
  attendees: string[];
  eventId: string;
  eventTitle: string;
  scheduledTime: Date;
  status: "pending" | "approved" | "rejected" | "executed" | "failed";
}

export class CalendarService {
  private calendar: any;
  private calendarId: string;

  get calendarInstance() {
    return this.calendar;
  }

  get currentCalendarId() {
    return this.calendarId;
  }

  setCalendarId(calendarId: string) {
    this.calendarId = calendarId;
  }

  constructor(calendarId?: string) {
    this.calendarId = calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
    this.initializeCalendar();
  }

  private initializeCalendar() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  /**
   * Accept a shared calendar by adding it to the calendar list
   * This is required for shared calendars to be accessible via the API
   */
  async acceptSharedCalendar(calendarId: string): Promise<void> {
    try {
      // console.log(`📥 Accepting shared calendar: ${calendarId}`);

      const response = await this.calendar.calendarList.insert({
        requestBody: {
          id: calendarId,
          selected: true,
        },
      });

      // console.log(
      //   `✅ Successfully accepted calendar: "${response.data.summary}"`
      // );

      // Update our current calendar ID if this is the one we want to use
      if (calendarId === this.calendarId || this.calendarId === "primary") {
        this.calendarId = calendarId;
        console.log(`📅 Set active calendar to: ${calendarId}`);
      }
    } catch (error) {
      console.error(`❌ Error accepting calendar ${calendarId}:`, error);

      // If calendar is already accepted, that's okay
      if ((error as any).code === 409) {
        console.log(`ℹ️ Calendar ${calendarId} is already accepted`);
        this.calendarId = calendarId;
        return;
      }

      throw error;
    }
  }

  /**
   * Get all calendars that the service account has access to
   * This includes calendars that need to be accepted
   */
  async getAccessibleCalendars(): Promise<any[]> {
    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error("Error fetching accessible calendars:", error);
      throw error;
    }
  }

  /**
   * Initialize calendar and accept shared calendar if needed
   */
  async initializeWithSharedCalendar(sharedCalendarId?: string): Promise<void> {
    try {
      // If a shared calendar ID is provided, try to accept it
      if (sharedCalendarId && sharedCalendarId !== "primary") {
        await this.acceptSharedCalendar(sharedCalendarId);
      }

      // Verify we can access the calendar
      await this.verifyCalendarAccess();
    } catch (error) {
      console.error("Error initializing calendar:", error);
      throw error;
    }
  }

  /**
   * Verify that we can access the current calendar
   */
  private async verifyCalendarAccess(): Promise<void> {
    try {
      await this.calendar.calendars.get({
        calendarId: this.calendarId,
      });
      console.log(
        `✅ Successfully verified access to calendar: ${this.calendarId}`
      );
    } catch (error) {
      console.error(`❌ Cannot access calendar ${this.calendarId}:`, error);
      throw new Error(
        `Cannot access calendar ${this.calendarId}. Please ensure the service account has been invited and the calendar has been accepted.`
      );
    }
  }

  /**
   * Generate a deterministic wallet from calendar ID
   */
  generateWalletFromCalendarId(calendarId: string): ethers.Wallet {
    const crypto = require("crypto");
    const seed = crypto.createHash("sha256").update(calendarId).digest();
    // Use the seed to create a deterministic private key
    const privateKey = ethers.hexlify(seed);
    return new ethers.Wallet(privateKey);
  }

  /**
   * Get all events from the calendar
   */
  async getEvents(
    timeMin?: string,
    timeMax?: string
  ): Promise<CalendarEvent[]> {
    try {
      // For transaction processing, we need to include past events
      // If no timeMin is provided, start from 7 days ago to catch past scheduled transactions
      const startTime =
        timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startTime,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];
      console.log(
        `[DEBUG] Fetched ${events.length} events from calendar: ${this.calendarId}`
      );
      // console.log(`[DEBUG] Time range: ${startTime} to ${timeMax || "now"}`);

      // Log only non-all-day events to avoid cluttering logs
      const nonAllDayEvents = events.filter((e: any) => e.start?.dateTime);
      const allDayEvents = events.filter(
        (e: any) => e.start?.date && !e.start?.dateTime
      );

      if (nonAllDayEvents.length > 0) {
        // console.log(
        //   `[DEBUG] Non-all-day events:`,
        //   nonAllDayEvents.map((e: any) => ({
        //     summary: e.summary,
        //     start: e.start?.dateTime || e.start?.date || "N/A",
        //   }))
        // );
      }

      if (allDayEvents.length > 0) {
        // console.log(`[DEBUG] Found ${allDayEvents.length} all-day events:`);
        allDayEvents.forEach((e: any, index: number) => {
          // console.log(
          //   `[DEBUG] All-day event ${index + 1}: "${e.summary}" (${
          //     e.start?.date
          //   })`
          // );
        });
      }

      return events;
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      throw error;
    }
  }

  /**
   * Get events that need to be processed (new events since last check)
   */
  async getNewEvents(lastSyncTime: Date): Promise<CalendarEvent[]> {
    const timeMin = lastSyncTime.toISOString();
    const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Next 24 hours

    console.log(`[DEBUG] getNewEvents - looking for events since: ${timeMin}`);
    return this.getEvents(timeMin, timeMax);
  }

  /**
   * Update an event's description with status information and title to denote completion
   */
  async updateEventStatus(
    eventId: string,
    status: string,
    details?: string
  ): Promise<void> {
    try {
      // First get the current event
      const event = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      const currentDescription = event.data.description || "";
      const statusUpdate = `\n\n--- WALLET STATUS ---\nStatus: ${status}\n${
        details ? `Details: ${details}\n` : ""
      }Last Updated: ${new Date().toISOString()}`;

      const updatedDescription = currentDescription.includes(
        "--- WALLET STATUS ---"
      )
        ? currentDescription.replace(
            /--- WALLET STATUS ---[\s\S]*/,
            statusUpdate
          )
        : currentDescription + statusUpdate;

      // Update event title to denote completion status
      let updatedTitle = event.data.summary || "";

      // Remove any existing status prefixes to avoid duplication
      updatedTitle = updatedTitle.replace(
        /^\[(EXECUTED|FAILED|ERROR)\]\s*/,
        ""
      );

      // Add status prefix to title
      if (status === "executed") {
        updatedTitle = `[EXECUTED] ${updatedTitle}`;
      } else if (status === "failed") {
        updatedTitle = `[FAILED] ${updatedTitle}`;
      } else if (status === "error") {
        updatedTitle = `[ERROR] ${updatedTitle}`;
      }

      // Determine color based on status
      let colorId = "1"; // Default color (blue)
      let colorName = "blue";
      if (status === "executed") {
        colorId = "2"; // Green for executed
        colorName = "green";
      } else if (status === "failed" || status === "error") {
        colorId = "11"; // Red for failed/error
        colorName = "red";
      }

      console.log(
        `[EVENT] Updating event ${eventId} to ${status} status with ${colorName} color`
      );

      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        requestBody: {
          ...event.data,
          summary: updatedTitle,
          description: updatedDescription,
          colorId: colorId,
        },
      });
    } catch (error) {
      console.error("Error updating event status:", error);
      throw error;
    }
  }

  /**
   * Parse transaction details from event title
   */
  parseTransactionEvent(event: CalendarEvent): TransactionEvent | null {
    const summary = event.summary.toLowerCase();

    // Check for WalletConnect events with URI in location field
    if (summary.includes("connect to dapp")) {
      // Skip already executed WalletConnect events
      if (summary.startsWith("[executed]")) {
        // console.log(
        //   `[DEBUG] Skipping already executed WalletConnect event: "${event.summary}"`
        // );
        return null;
      }

      // Look for WalletConnect URI in the location field
      const location = event.location || "";
      // console.log(
      //   `[DEBUG] Checking WalletConnect event location: "${location}"`
      // );
      const walletConnectUriMatch = location.match(/wc:[a-zA-Z0-9@:?&=.-]+/);
      // console.log(
      //   `[DEBUG] WalletConnect URI match result:`,
      //   walletConnectUriMatch
      // );

      if (walletConnectUriMatch) {
        console.log(
          `[DEBUG] Found WalletConnect URI in event location: ${walletConnectUriMatch[0]}`
        );
        return {
          type: "connect",
          walletConnectUri: walletConnectUriMatch[0],
          requiresApproval: (event.attendees?.length || 0) > 0,
          attendees: event.attendees?.map((a) => a.email) || [],
          eventId: event.id,
          eventTitle: event.summary,
          scheduledTime: new Date(
            event.start.dateTime || event.start.date || ""
          ),
          status: "pending",
        };
      } else {
        console.log(
          `[DEBUG] WalletConnect event found but no URI in location field`
        );
        return null;
      }
    }

    // Skip events that have already been processed (have status prefixes)
    if (
      summary.startsWith("[executed]") ||
      summary.startsWith("[failed]") ||
      summary.startsWith("[error]")
    ) {
      // console.log(
      //   `[DEBUG] Skipping already processed event: "${event.summary}"`
      // );
      return null;
    }

    console.log(`[DEBUG] Parsing event: "${event.summary}"`);
    console.log(`[DEBUG] Event summary (lowercase): "${summary}"`);
    console.log(`[DEBUG] Event start time:`, event.start);
    console.log(`[DEBUG] Event attendees:`, event.attendees);

    // Parse "Send X ETH/USDC/USDT/PYUSD/tRBTC to ADDRESS or ENS" format
    const sendMatch = summary.match(
      /send\s+([\d.]+)\s+(eth|usdc|usdt|dai|pyusd|trbtc)\s+to\s+([a-zA-Z0-9.-]+\.eth|0x[a-fA-F0-9]{40})/i
    );

    console.log(`[DEBUG] Send regex match result:`, sendMatch);

    if (sendMatch) {
      const scheduledTime = new Date(
        event.start.dateTime || event.start.date || ""
      );

      // Extract the original address from the event summary (preserve case)
      const originalSummary = event.summary;
      const addressMatch = originalSummary.match(/to\s+(0x[a-fA-F0-9]{40})/i);
      const originalAddress = addressMatch ? addressMatch[1] : sendMatch[3];

      console.log(
        `[DEBUG] Successfully parsed send transaction: ${sendMatch[1]} ${
          sendMatch[2]
        } to ${originalAddress} (${
          originalAddress.includes(".eth") ? "ENS name" : "address"
        })`
      );
      console.log(`[DEBUG] Scheduled time: ${scheduledTime.toISOString()}`);
      console.log(`[DEBUG] Current time: ${new Date().toISOString()}`);
      console.log(`[DEBUG] Ready to execute: ${scheduledTime <= new Date()}`);

      return {
        type: "send",
        amount: sendMatch[1],
        token: sendMatch[2].toUpperCase(),
        toAddress: originalAddress,
        requiresApproval: (event.attendees?.length || 0) > 0,
        attendees: event.attendees?.map((a) => a.email) || [],
        eventId: event.id,
        eventTitle: event.summary,
        scheduledTime: scheduledTime,
        status: "pending",
      };
    }

    // Parse "Swap X TOKEN to TOKEN" format with optional slippage
    // Supports: "Swap 1 ETH to USDC", "Swap 1 ETH to USDC 5%", "Swap 1 ETH to USDC with 3% slippage"
    const swapMatch = summary.match(
      /swap\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)(?:\s+(?:with\s+)?(\d+(?:\.\d+)?)%?\s*(?:slippage)?)?/i
    );
    if (swapMatch) {
      const slippagePct = swapMatch[4] ? parseFloat(swapMatch[4]) : undefined;

      return {
        type: "swap",
        amount: swapMatch[1],
        fromToken: swapMatch[2].toUpperCase(),
        toToken: swapMatch[3].toUpperCase(),
        slippagePct: slippagePct,
        requiresApproval: (event.attendees?.length || 0) > 0,
        attendees: event.attendees?.map((a) => a.email) || [],
        eventId: event.id,
        eventTitle: event.summary,
        scheduledTime: new Date(event.start.dateTime || event.start.date || ""),
        status: "pending",
      };
    }

    console.log(`[DEBUG] Could not parse event: "${event.summary}"`);
    return null;
  }

  /**
   * Check if attendees have approved the event (RSVP'd "Yes")
   */
  async checkEventApproval(
    eventId: string
  ): Promise<{ approved: boolean; voteCount: number; totalAttendees: number }> {
    try {
      const event = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      const attendees = event.data.attendees || [];
      const totalAttendees = attendees.length;

      if (totalAttendees === 0) {
        return { approved: true, voteCount: 0, totalAttendees: 0 };
      }

      const approvedCount = attendees.filter(
        (attendee: any) => attendee.responseStatus === "accepted"
      ).length;

      // Require at least 50% approval
      const approved = approvedCount >= Math.ceil(totalAttendees / 2);

      return { approved, voteCount: approvedCount, totalAttendees };
    } catch (error) {
      console.error("Error checking event approval:", error);
      throw error;
    }
  }

  /**
   * Create a WalletConnect connection event
   */
  async createWalletConnectEvent(
    calendarId: string,
    walletAddress: string,
    walletBalance: string,
    tokenBalances: any[] = []
  ): Promise<CalendarEvent> {
    try {
      // Get current date in local timezone
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      console.log(
        `[CALENDAR] Creating WalletConnect event for date: ${dateString}`
      );

      // Build description with ETH balance
      let description = `Wallet Address: ${walletAddress}\nWallet Balance: ${walletBalance}`;

      // Add ERC20 token balances if any
      if (tokenBalances && tokenBalances.length > 0) {
        description += "\n\nERC20 Token Balances:";
        for (const token of tokenBalances) {
          description += `\n• ${token.balance}`;
        }
      }

      const event = {
        summary: "Connect to Dapp",
        description: description,
        location: "wc://...", // WalletConnect URI goes in location field
        start: {
          date: dateString,
        },
        end: {
          date: dateString,
        },
        allDay: true,
      };

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        requestBody: event,
      });

      return response.data;
    } catch (error) {
      console.error("Error creating WalletConnect event:", error);
      throw error;
    }
  }

  /**
   * Update WalletConnect event with current wallet info including ERC20 token balances
   */
  async updateWalletConnectEvent(
    eventId: string,
    walletAddress: string,
    walletBalance: string,
    tokenBalances: any[] = []
  ): Promise<void> {
    try {
      const event = await this.calendar.events.get({
        calendarId: this.calendarId,
        eventId: eventId,
      });

      const currentDescription = event.data.description || "";

      // Build wallet info with ETH balance
      let walletInfo = `Wallet Address: ${walletAddress}\nWallet Balance: ${walletBalance}`;

      // Add ERC20 token balances if any
      if (tokenBalances && tokenBalances.length > 0) {
        walletInfo += "\n\nERC20 Token Balances:";
        for (const token of tokenBalances) {
          walletInfo += `\n• ${token.balance}`;
        }
      }

      // Update or add wallet info (simplified since we no longer include WalletConnect instructions in description)
      const updatedDescription = currentDescription.includes("Wallet Address:")
        ? currentDescription.replace(/Wallet Address:.*$/s, walletInfo)
        : walletInfo;

      // Check if the description actually changed to avoid unnecessary updates
      if (currentDescription === updatedDescription) {
        return;
      }

      console.log(
        `[CALENDAR] Updating WalletConnect event ${eventId} with token balances`
      );

      await this.calendar.events.update({
        calendarId: this.calendarId,
        eventId: eventId,
        requestBody: {
          ...event.data,
          description: updatedDescription,
          // Preserve the location field which contains the WalletConnect URI
          location: event.data.location,
        },
      });

      console.log(`[CALENDAR] Successfully updated event ${eventId}`);
    } catch (error) {
      console.error("Error updating WalletConnect event:", error);
      throw error;
    }
  }

  /**
   * Clear only WalletConnect events from the calendar
   */
  async clearWalletConnectEvents(): Promise<{
    deleted: number;
    errors: number;
  }> {
    try {
      // Get all events from the past 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const events = await this.getEvents(sevenDaysAgo.toISOString());

      // console.log(
      //   `[CLEAR] Found ${events.length} events to check for WalletConnect events`
      // );

      // Filter only WalletConnect events
      const walletConnectEvents = events.filter((event: any) =>
        event.summary?.toLowerCase().includes("connect to dapp")
      );

      // console.log(
      //   `[CLEAR] Found ${walletConnectEvents.length} WalletConnect events to delete`
      // );
      // console.log(`[CLEAR] Using calendar ID: ${this.calendarId}`);

      let deleted = 0;
      let errors = 0;

      for (const event of walletConnectEvents) {
        try {
          await this.calendar.events.delete({
            calendarId: this.calendarId,
            eventId: event.id,
          });
          console.log(`[CLEAR] ✅ Successfully deleted: ${event.summary}`);
          deleted++;
        } catch (error) {
          console.error(`[CLEAR] ❌ Failed to delete: ${event.summary}`, error);
          errors++;
        }
      }

      // console.log(
      //   `[CLEAR] Deleted ${deleted} WalletConnect events, ${errors} errors`
      // );

      // Verify events are deleted
      // console.log(`[CLEAR] Verifying WalletConnect events are deleted...`);
      const remainingEvents = await this.getEvents(sevenDaysAgo.toISOString());
      const remainingWalletConnectEvents = remainingEvents.filter(
        (event: any) => event.summary?.toLowerCase().includes("connect to dapp")
      );
      console.log(
        `[CLEAR] Remaining WalletConnect events after deletion: ${remainingWalletConnectEvents.length}`
      );

      return { deleted, errors };
    } catch (error) {
      console.error("Error clearing WalletConnect events:", error);
      throw error;
    }
  }

  /**
   * Clear all events from the calendar (for fresh start)
   */
  async clearAllEvents(): Promise<{ deleted: number; errors: number }> {
    try {
      // Get events from the past 7 days to ensure we clear everything
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const events = await this.getEvents(sevenDaysAgo.toISOString());
      let deleted = 0;
      let errors = 0;

      console.log(
        `[CLEAR] Found ${events.length} events to delete from past 7 days`
      );
      console.log(`[CLEAR] Using calendar ID: ${this.calendarId}`);

      for (const event of events) {
        try {
          console.log(
            `[CLEAR] Attempting to delete event: ${event.summary} (ID: ${event.id})`
          );
          await this.calendar.events.delete({
            calendarId: this.calendarId,
            eventId: event.id,
          });
          deleted++;
          console.log(`[CLEAR] ✅ Successfully deleted: ${event.summary}`);
        } catch (error) {
          errors++;
          console.error(
            `[CLEAR] ❌ Failed to delete event ${event.id} (${event.summary}):`,
            error
          );
        }
      }

      console.log(`[CLEAR] Deleted ${deleted} events, ${errors} errors`);

      // Verify events are actually gone
      console.log(`[CLEAR] Verifying events are deleted...`);
      const remainingEvents = await this.getEvents(sevenDaysAgo.toISOString());
      console.log(
        `[CLEAR] Remaining events after deletion: ${remainingEvents.length}`
      );
      if (remainingEvents.length > 0) {
        console.log(
          `[CLEAR] WARNING: ${remainingEvents.length} events still exist!`
        );
        console.log(
          `[CLEAR] Remaining events:`,
          remainingEvents.map((e) => e.summary)
        );
      }

      return { deleted, errors };
    } catch (error) {
      console.error("Error clearing calendar events:", error);
      throw error;
    }
  }

  /**
   * Get events that are scheduled to execute now or in the past
   */
  async getEventsToExecute(): Promise<TransactionEvent[]> {
    const now = new Date();
    // Look for events from 7 days ago to 7 days in the future to catch all events
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const events = await this.getEvents(
      sevenDaysAgo.toISOString(),
      sevenDaysFromNow.toISOString()
    );

    console.log(`[DEBUG] Checking ${events.length} events for execution`);
    console.log(`[DEBUG] Current time: ${now.toISOString()}`);
    console.log(
      `[DEBUG] Looking for events from 7 days ago to 7 days future: ${sevenDaysAgo.toISOString()} to ${sevenDaysFromNow.toISOString()}`
    );

    const transactionEvents: TransactionEvent[] = [];
    const allEvents = events; // Process all events, including WalletConnect events

    console.log(
      `[DEBUG] Found ${allEvents.length} events to check for execution`
    );
    if (allEvents.length > 0) {
      console.log(
        `[DEBUG] Event summaries:`,
        allEvents.map((e) => e.summary)
      );
    }

    for (const event of allEvents) {
      const transactionEvent = this.parseTransactionEvent(event);
      if (transactionEvent) {
        console.log(
          `[DEBUG] Parsed transaction: "${
            event.summary
          }" - Scheduled: ${transactionEvent.scheduledTime.toISOString()}`
        );

        if (transactionEvent.scheduledTime <= now) {
          console.log(`[DEBUG] Event ready to execute: "${event.summary}"`);
          transactionEvents.push(transactionEvent);
        }
      }
    }

    console.log(
      `[DEBUG] Found ${transactionEvents.length} events ready to execute`
    );
    return transactionEvents;
  }
}

export default CalendarService;
