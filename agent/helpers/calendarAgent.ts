import cron from "node-cron";
import CalendarWalletService from "./calendarWalletService";
import CalendarService from "./calendarService";
import { NameStoneService } from "./nameStoneService";

export interface CalendarAgentConfig {
  calendarId: string;
  checkIntervalMinutes: number;
  autoCreateWalletConnectEvent: boolean;
}

export class CalendarAgent {
  private calendarWalletService: CalendarWalletService;
  private calendarService: CalendarService;
  private nameStoneService: NameStoneService;
  public config: CalendarAgentConfig; // Make public for access from index.ts
  private isRunning = false;
  private lastSyncTime: Date;

  constructor(config: CalendarAgentConfig) {
    this.config = config;
    this.calendarService = new CalendarService(this.config.calendarId);
    this.calendarWalletService = new CalendarWalletService(
      this.calendarService
    );
    this.nameStoneService = new NameStoneService();
    this.lastSyncTime = new Date();
  }

  /**
   * Start the calendar agent
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Calendar agent is already running");
      return;
    }

    console.log(
      `Starting Calendar Agent for calendar: ${this.config.calendarId}`
    );
    this.isRunning = true;

    // Initial setup
    await this.initializeCalendar();

    // Fresh start: Clear all events and create a clean WalletConnect event
    console.log("[STARTUP] Starting fresh - clearing all events...");
    await this.freshStart();

    // Set up cron job to check for events
    const intervalSeconds = Math.round(this.config.checkIntervalMinutes * 60);
    const cronExpression = `*/${intervalSeconds} * * * * *`; // Every N seconds
    cron.schedule(cronExpression, async () => {
      await this.processCalendarEvents();
    });

    // Initial processing
    await this.processCalendarEvents();

    console.log(
      `Calendar agent started. Checking for events every ${intervalSeconds} seconds.`
    );
  }

  /**
   * Stop the calendar agent
   */
  stop(): void {
    this.isRunning = false;
    console.log("Calendar agent stopped");
  }

  /**
   * Initialize the calendar setup
   */
  private async initializeCalendar(): Promise<void> {
    try {
      // Initialize calendar service and accept shared calendar if needed
      await this.calendarService.initializeWithSharedCalendar(
        this.config.calendarId
      );

      // Get wallet info to verify setup
      const walletInfo = await this.calendarWalletService.getWalletInfo(
        this.config.calendarId
      );
      console.log(`Wallet initialized for calendar ${this.config.calendarId}:`);
      console.log(`Address: ${walletInfo.address}`);
      console.log(`Balance: ${walletInfo.balance}`);
      console.log(`Explorer: ${walletInfo.explorerUrl}`);

      // Try to create a unique subname for this calendar
      await this.attemptSubnameCreation();

      // Create WalletConnect event if enabled
      if (this.config.autoCreateWalletConnectEvent) {
        await this.ensureWalletConnectEvent();
      }
    } catch (error) {
      console.error("Error initializing calendar:", error);
      throw error;
    }
  }

  /**
   * Attempt to create a unique subname for the calendar
   * This is a non-blocking operation - failures won't prevent calendar setup
   */
  private async attemptSubnameCreation(): Promise<void> {
    try {
      console.log(`🏷️ Attempting to create subname for calendar: ${this.config.calendarId}`);
      
      const result = await this.nameStoneService.createSubnameWithRetry(
        this.config.calendarId,
        3 // Max 3 retries
      );

      if (result.success) {
        console.log(`✅ Subname created successfully: ${result.subname}`);
        console.log(`📝 ${result.message}`);
      } else {
        console.warn(`⚠️ Subname creation failed: ${result.message}`);
        console.warn(`🔧 Calendar setup will continue without subname`);
      }
    } catch (error) {
      console.warn(`⚠️ Subname creation encountered an error:`, error);
      console.warn(`🔧 Calendar setup will continue without subname`);
      // Don't throw - this should not block calendar initialization
    }
  }

  /**
   * Fresh start: Clear all events and create a clean WalletConnect event
   */
  private async freshStart(): Promise<void> {
    try {
      // Only clear WalletConnect events, not transaction events
      const result = await this.calendarService.clearWalletConnectEvents();
      console.log(
        `[FRESH START] Cleared ${result.deleted} WalletConnect events, ${result.errors} errors`
      );

      // Create fresh WalletConnect event
      if (this.config.autoCreateWalletConnectEvent) {
        console.log("[FRESH START] Creating fresh WalletConnect event...");
        await this.calendarWalletService.createWalletConnectEvent(
          this.config.calendarId
        );
        console.log("[FRESH START] WalletConnect event created successfully");
      }

      // Reset lastSyncTime to now to avoid fetching old events
      this.lastSyncTime = new Date();
      console.log("[FRESH START] Reset lastSyncTime to current time");

      console.log("[FRESH START] Fresh start completed successfully");
    } catch (error) {
      console.error("[FRESH START] Error during fresh start:", error);
      throw error;
    }
  }

  /**
   * Clean up duplicate WalletConnect events
   */
  private async cleanupDuplicateEvents(): Promise<void> {
    try {
      const events = await this.calendarService.getEvents();
      const walletConnectEvents = events.filter((event) =>
        event.summary.toLowerCase().includes("connect to dapp")
      );

      if (walletConnectEvents.length > 1) {
        console.log(
          `[CLEANUP] Found ${walletConnectEvents.length} duplicate WalletConnect events, cleaning up...`
        );

        // Keep only the most recent one
        const sortedEvents = walletConnectEvents.sort(
          (a, b) =>
            new Date(b.start.dateTime || b.start.date || "").getTime() -
            new Date(a.start.dateTime || a.start.date || "").getTime()
        );
        const keepEvent = sortedEvents[0];
        const deleteEvents = sortedEvents.slice(1);

        console.log(
          `[CLEANUP] Keeping event ${keepEvent.id}, deleting ${deleteEvents.length} duplicates`
        );

        for (const event of deleteEvents) {
          try {
            await this.calendarService.calendarInstance.events.delete({
              calendarId: this.config.calendarId,
              eventId: event.id,
            });
            console.log(`[CLEANUP] Deleted duplicate event ${event.id}`);
          } catch (error) {
            console.error(
              `[CLEANUP] Failed to delete duplicate event ${event.id}:`,
              error
            );
          }
        }
      }
    } catch (error) {
      console.error("[CLEANUP] Error cleaning up duplicate events:", error);
    }
  }

  /**
   * Ensure there's a WalletConnect event in the calendar
   */
  private async ensureWalletConnectEvent(): Promise<void> {
    try {
      const events = await this.calendarService.getEvents();
      const walletConnectEvents = events.filter((event) =>
        event.summary.toLowerCase().includes("connect to dapp")
      );

      if (walletConnectEvents.length === 0) {
        console.log(
          "[WALLETCONNECT] No WalletConnect event found, creating one..."
        );
        await this.calendarWalletService.createWalletConnectEvent(
          this.config.calendarId
        );
        console.log("[WALLETCONNECT] WalletConnect event created successfully");
      } else {
        console.log(
          `[WALLETCONNECT] Found ${walletConnectEvents.length} WalletConnect event(s)`
        );
      }
    } catch (error) {
      console.error(
        "[WALLETCONNECT] Error managing WalletConnect event:",
        error
      );
    }
  }

  /**
   * Process all calendar events
   */
  private async processCalendarEvents(): Promise<void> {
    if (!this.isRunning) return;

    try {
      console.log(
        `[${new Date().toISOString()}] Processing calendar events...`
      );

      // Clean up duplicate events
      await this.cleanupDuplicateEvents();

      // Check for balance changes and update WalletConnect events
      console.log("[PROCESSING] Checking for balance changes...");
      await this.calendarWalletService.checkAndUpdateBalanceIfChanged(
        this.config.calendarId
      );

      // Check for deleted WalletConnect events and disconnect sessions
      console.log("[PROCESSING] Checking for deleted WalletConnect events...");
      const wasDisconnected =
        await this.calendarWalletService.checkForDeletedWalletConnectEvents(
          this.config.calendarId
        );

      // If a session was disconnected, create a fresh WalletConnect event
      if (wasDisconnected && this.config.autoCreateWalletConnectEvent) {
        console.log(
          "[WALLETCONNECT] Creating fresh WalletConnect event after disconnection"
        );
        await this.calendarWalletService.createWalletConnectEvent(
          this.config.calendarId
        );
      }

      // Check for new events since last sync
      const newEvents = await this.calendarService.getNewEvents(
        this.lastSyncTime
      );

      if (newEvents.length > 0) {
        console.log(`Found ${newEvents.length} new events to process`);

        for (const event of newEvents) {
          const transactionEvent =
            this.calendarService.parseTransactionEvent(event);
          if (transactionEvent) {
            console.log(
              `New transaction event: ${transactionEvent.eventTitle}`
            );
          }
        }
      }

      // Process all pending events (including new ones)
      await this.calendarWalletService.processPendingEvents(
        this.config.calendarId
      );

      // Update last sync time
      this.lastSyncTime = new Date();

      console.log("Calendar events processing completed");
    } catch (error) {
      console.error("Error processing calendar events:", error);
    }
  }

  /**
   * Get current wallet information
   */
  async getWalletInfo() {
    return this.calendarWalletService.getWalletInfo(this.config.calendarId);
  }

  /**
   * Manually trigger event processing
   */
  async processEventsNow(): Promise<void> {
    console.log("Manually triggering event processing...");

    // Ensure WalletConnect event exists
    await this.ensureWalletConnectEvent();

    // Check for balance changes first
    await this.calendarWalletService.checkAndUpdateBalanceIfChanged(
      this.config.calendarId
    );

    await this.processCalendarEvents();
  }

  /**
   * Get status of the agent
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      calendarId: this.config.calendarId,
      lastSyncTime: this.lastSyncTime,
      checkIntervalMinutes: this.config.checkIntervalMinutes,
    };
  }
}

export default CalendarAgent;
