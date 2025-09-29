import "dotenv/config";

import { Agent } from "@openserv-labs/sdk";
import { z } from "zod";
import express from "express";
import cors from "cors";
import CalendarAgent, { CalendarAgentConfig } from "./helpers/calendarAgent";
import CalendarWalletService from "./helpers/calendarWalletService";
import DatabaseService from "./helpers/database";
import { NameStoneService } from "./helpers/nameStoneService";

// Express app setup
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Calendar Wallet Service
const calendarWalletService = new CalendarWalletService();

// Initialize NameStone Service
const nameStoneService = new NameStoneService();

// Calendar Agent instance
let calendarAgent: CalendarAgent | null = null;
let databaseService: DatabaseService;

// Initialize Calendar Agent
async function initializeCalendarAgent() {
  try {
    // Initialize database
    databaseService = new DatabaseService();
    await databaseService.initialize();

    // Check if we have an active calendar in the database
    const activeCalendar = await databaseService.getActiveCalendar();

    if (activeCalendar) {
      console.log(
        `📅 Found active calendar in database: ${activeCalendar.summary} (${activeCalendar.calendarId})`
      );

      const config: CalendarAgentConfig = {
        calendarId: activeCalendar.calendarId,
        checkIntervalMinutes: 0.083, // 5 seconds (0.083 minutes)
        autoCreateWalletConnectEvent: true,
      };

      calendarAgent = new CalendarAgent(config);
      await calendarAgent.start();
      console.log("✅ Calendar Agent initialized with saved calendar");
    } else {
      console.log(
        "📅 No active calendar found. Use /onboard/{calendarId} to add a calendar."
      );
    }
  } catch (error) {
    console.error("❌ Failed to initialize Calendar Agent:", error);
    process.exit(1);
  }
}

// Agent setup for API endpoints
const agent = new Agent({
  systemPrompt: `You are an AI agent that manages cryptocurrency wallets through Google Calendar events. 

Your capabilities:
- Monitor Google Calendar events for transaction commands
- Execute EVM transactions based on event schedules
- Handle RSVP-based approval voting for transactions
- Manage WalletConnect connections through calendar events
- Provide wallet information and transaction status updates
- Execute token swaps on Uniswap V3

Event formats you understand:
- "Send X ETH to 0x..." or "Send X ETH to name.eth" - Transfer ETH or ERC-20 tokens (supports both addresses and ENS names)
- "Swap X TOKEN to TOKEN" - Token swaps on Uniswap V3
- "Connect to Dapp" - WalletConnect connections

Supported tokens for swaps: ETH, USDC, USDT, DAI, WETH
Default slippage: 2%

You update event descriptions with transaction status and results.`,
});

// Add capabilities to the agent
agent.addCapability({
  name: "getWalletInfo",
  description:
    "Get wallet information including address and balance for a specific calendar",
  schema: z.object({
    calendarId: z.string().describe("The calendar ID to get wallet info for"),
  }),
  async run({ args }) {
    try {
      const walletInfo = await calendarWalletService.getWalletInfo(
        args.calendarId
      );
      return JSON.stringify({
        success: true,
        data: walletInfo,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

agent.addCapability({
  name: "processCalendarEvents",
  description: "Manually trigger processing of calendar events",
  schema: z.object({}),
  async run() {
    try {
      if (calendarAgent) {
        await calendarAgent.processEventsNow();
        return JSON.stringify({
          success: true,
          message: "Calendar events processed successfully",
        });
      } else {
        return JSON.stringify({
          success: false,
          error: "Calendar agent not initialized",
        });
      }
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

agent.addCapability({
  name: "getAgentStatus",
  description: "Get the current status of the calendar agent",
  schema: z.object({}),
  async run() {
    try {
      if (calendarAgent) {
        const status = calendarAgent.getStatus();
        return JSON.stringify({
          success: true,
          data: status,
        });
      } else {
        return JSON.stringify({
          success: false,
          error: "Calendar agent not initialized",
        });
      }
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});

// API Routes
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Calendar Wallet Agent",
    version: "1.0.0",
  });
});

app.get("/wallet/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;
    const walletInfo = await calendarWalletService.getWalletInfo(calendarId);
    res.json({
      success: true,
      data: walletInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/process-events", async (req, res) => {
  try {
    if (calendarAgent) {
      await calendarAgent.processEventsNow();
      res.json({
        success: true,
        message: "Events processed successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Calendar agent not initialized",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Update WalletConnect event balance immediately
app.post("/update-balance/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Check for balance changes and update if needed (smart update)
    const balanceUpdated =
      await calendarWalletService.checkAndUpdateBalanceIfChanged(calendarId);

    // Get current wallet info for response
    const walletInfo = await calendarWalletService.getWalletInfo(calendarId);

    res.json({
      success: true,
      message: balanceUpdated
        ? "Balance changed and calendar updated"
        : "No balance change detected",
      data: {
        address: walletInfo.address,
        balance: walletInfo.balance,
        balanceWei: walletInfo.balanceWei,
        balanceChanged: balanceUpdated,
      },
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Debug: List all events in calendar
app.get("/debug-events/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Get all events from 7 days ago to 7 days in the future
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const events = await calendarWalletService.calendarService.getEvents(
      sevenDaysAgo.toISOString(),
      sevenDaysFromNow.toISOString()
    );

    res.json({
      success: true,
      message: `Found ${events.length} events from 7 days ago to 7 days future`,
      data: {
        timeRange: {
          from: sevenDaysAgo.toISOString(),
          to: sevenDaysFromNow.toISOString(),
        },
        events: events.map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start,
          end: e.end,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Manually trigger event processing
app.post("/process-events/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    if (!calendarAgent) {
      res.status(400).json({
        success: false,
        error: "Calendar agent is not running",
      });
      return;
    }

    console.log(
      `[MANUAL] Triggering event processing for calendar: ${calendarId}`
    );

    // Process events immediately
    await calendarAgent.processEventsNow();

    res.json({
      success: true,
      message: "Event processing triggered successfully",
    });
  } catch (error) {
    console.error("Error processing events:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Disconnect WalletConnect session
app.post("/disconnect-walletconnect/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    console.log(
      `[DISCONNECT] Manually disconnecting WalletConnect for calendar: ${calendarId}`
    );

    // Disconnect the session
    const wasDisconnected = await calendarWalletService.disconnectWalletConnect(
      calendarId
    );

    // Create a fresh WalletConnect event
    await calendarWalletService.createWalletConnectEvent(calendarId);

    res.json({
      success: true,
      message: wasDisconnected
        ? "WalletConnect session disconnected and fresh event created"
        : "No active session found, fresh event created",
      data: {
        calendarId,
        wasDisconnected,
        freshEventCreated: true,
      },
    });
  } catch (error) {
    console.error("Error disconnecting WalletConnect:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test WalletConnect connection
app.post("/test-walletconnect/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { uri } = req.body;

    if (!uri) {
      res.status(400).json({
        success: false,
        error: "WalletConnect URI is required in request body",
      });
      return;
    }

    // Create a test WalletConnect event with the provided URI
    const now = new Date();
    const event = {
      summary: "Connect to Dapp",
      description: `Wallet Address: [Will be updated automatically]\nWallet Balance: [Will be updated automatically]`,
      location: uri, // WalletConnect URI goes in location field
      start: {
        dateTime: now.toISOString(),
      },
      end: {
        dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      },
    };

    const response =
      await calendarWalletService.calendarService.calendarInstance.events.insert(
        {
          calendarId: calendarId,
          requestBody: event,
        }
      );

    console.log(`[TEST] Created test WalletConnect event with URI: ${uri}`);

    res.json({
      success: true,
      message: `Test WalletConnect event created with URI: ${uri}`,
      data: {
        eventId: response.data.id,
        event: event,
        uri: uri,
      },
    });
  } catch (error) {
    console.error("Error creating test WalletConnect event:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test Send transaction
app.post("/test-send/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    // Use a valid Ethereum address for testing
    const validTestAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Example Ethereum address
    const amount = "0.01";

    // Create a test Send ETH event for immediate execution
    const now = new Date();
    const event = {
      summary: `Send ${amount} ETH to ${validTestAddress}`,
      start: {
        dateTime: now.toISOString(),
      },
      end: {
        dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      },
    };

    const response =
      await calendarWalletService.calendarService.calendarInstance.events.insert(
        {
          calendarId: calendarId,
          requestBody: event,
        }
      );

    console.log(`[TEST] Created test Send ETH event: ${event.summary}`);

    res.json({
      success: true,
      message: `Test Send ETH event created: ${amount} ETH to ${validTestAddress}`,
      data: {
        eventId: response.data.id,
        event: event,
      },
    });
  } catch (error) {
    console.error("Error creating test Send ETH event:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test Send PYUSD transaction
app.post("/test-send-pyusd/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    // Use a valid Ethereum address for testing
    const validTestAddress = "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"; // Example Ethereum address
    const amount = "10"; // 10 PYUSD

    // Create a test Send PYUSD event for immediate execution
    const now = new Date();
    const event = {
      summary: `Send ${amount} PYUSD to ${validTestAddress}`,
      start: {
        dateTime: now.toISOString(),
      },
      end: {
        dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      },
    };

    const response =
      await calendarWalletService.calendarService.calendarInstance.events.insert(
        {
          calendarId: calendarId,
          requestBody: event,
        }
      );

    console.log(`[TEST] Created test Send PYUSD event: ${event.summary}`);

    res.json({
      success: true,
      message: `Test Send PYUSD event created: ${amount} PYUSD to ${validTestAddress}`,
      data: {
        eventId: response.data.id,
        event: event,
      },
    });
  } catch (error) {
    console.error("Error creating test Send PYUSD event:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test Swap transaction
app.post("/test-swap/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;
    const { fromToken = "ETH", toToken = "USDC", amount = "0.1" } = req.body;

    // Create a test Swap event for immediate execution
    const now = new Date();
    const event = {
      summary: `Swap ${amount} ${fromToken} to ${toToken}`,
      start: {
        dateTime: now.toISOString(),
      },
      end: {
        dateTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      },
    };

    const response =
      await calendarWalletService.calendarService.calendarInstance.events.insert(
        {
          calendarId: calendarId,
          requestBody: event,
        }
      );

    console.log(`[TEST] Created test Swap event: ${event.summary}`);

    res.json({
      success: true,
      message: `Test Swap event created: ${amount} ${fromToken} to ${toToken}`,
      data: {
        eventId: response.data.id,
        event: event,
      },
    });
  } catch (error) {
    console.error("Error creating test Swap event:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get available pools for swap
app.get("/pools/:fromToken/:toToken", async (req, res) => {
  try {
    const { fromToken, toToken } = req.params;

    const pools = await calendarWalletService.swapService.getAvailablePools(
      fromToken,
      toToken
    );

    res.json({
      success: true,
      data: {
        fromToken,
        toToken,
        pools,
      },
    });
  } catch (error) {
    console.error("Error getting pools:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Discover available assets on testnet
app.get("/discover-assets", async (req, res) => {
  try {
    const availableAssets =
      await calendarWalletService.swapService.discoverAvailableAssets();

    res.json({
      success: true,
      data: {
        availableAssets,
        message: "These are the assets currently available on the testnet",
      },
    });
  } catch (error) {
    console.error("Error discovering assets:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Test ETH asset access
app.get("/test-eth", async (req, res) => {
  try {
    const ethWorks = await calendarWalletService.swapService.testNativeToken();

    res.json({
      success: true,
      data: {
        ethAssetAccessible: ethWorks,
        message: ethWorks
          ? "ETH asset is accessible on testnet"
          : "ETH asset is not accessible - check network configuration",
      },
    });
  } catch (error) {
    console.error("Error testing ETH asset:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Check if pools exist for a trading pair
app.get("/check-pools/:fromToken/:toToken", async (req, res) => {
  try {
    const { fromToken, toToken } = req.params;
    const poolsExist = await calendarWalletService.swapService.checkPoolsExist(
      fromToken,
      toToken
    );

    res.json({
      success: true,
      data: {
        fromToken,
        toToken,
        poolsExist,
        message: poolsExist
          ? `Pools available for ${fromToken} -> ${toToken}`
          : `No pools available for ${fromToken} -> ${toToken} on testnet`,
      },
    });
  } catch (error) {
    console.error("Error checking pools:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Demo swap functionality (shows what would happen)
app.get("/demo-swap/:fromToken/:toToken", async (req, res) => {
  try {
    const { fromToken, toToken } = req.params;

    // Check if pools exist
    const poolsExist = await calendarWalletService.swapService.checkPoolsExist(
      fromToken,
      toToken
    );

    // Get available assets
    const availableAssets =
      await calendarWalletService.swapService.discoverAvailableAssets();

    res.json({
      success: true,
      data: {
        fromToken,
        toToken,
        poolsExist,
        availableAssets,
        message: poolsExist
          ? `✅ Swap possible: ${fromToken} -> ${toToken}`
          : `❌ No pools available: ${fromToken} -> ${toToken}`,
        suggestion: poolsExist
          ? `You can create a calendar event: "Swap 0.1 ${fromToken} to ${toToken}"`
          : `Try these available pairs: ${Object.keys(availableAssets).join(
              ", "
            )}`,
      },
    });
  } catch (error) {
    console.error("Error in demo swap:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Simple test endpoint that doesn't trigger calendar processing
app.get("/test-swap-safe/:fromToken/:toToken", async (req, res) => {
  try {
    const { fromToken, toToken } = req.params;

    console.log(`[SAFE-TEST] Testing ${fromToken} -> ${toToken}`);

    // Just test asset fetching without pool discovery
    const fromAsset = calendarWalletService.swapService.getToken(fromToken);
    const toAsset = calendarWalletService.swapService.getToken(toToken);

    res.json({
      success: true,
      data: {
        fromToken,
        toToken,
        fromAsset: {
          address: fromAsset.address,
          symbol: fromAsset.symbol,
          name: fromAsset.name,
          decimals: fromAsset.decimals,
        },
        toAsset: {
          address: toAsset.address,
          symbol: toAsset.symbol,
          name: toAsset.name,
          decimals: toAsset.decimals,
        },
        message: `✅ Both assets accessible: ${fromToken} (${fromAsset.address}) -> ${toToken} (${toAsset.address})`,
      },
    });
  } catch (error) {
    console.error("Error in safe swap test:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Force clear all events (nuclear option)
app.post("/clear-all/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Clear all events from past 7 days
    const clearResult =
      await calendarWalletService.calendarService.clearAllEvents();

    res.json({
      success: true,
      message: `Cleared ${clearResult.deleted} events from past 7 days`,
      data: {
        eventsDeleted: clearResult.deleted,
        errors: clearResult.errors,
      },
    });
  } catch (error) {
    console.error("Error clearing all events:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Fresh start: Clear all events and create fresh WalletConnect event
app.post("/fresh-start/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Clear all events
    const clearResult =
      await calendarWalletService.calendarService.clearAllEvents();

    // Create fresh WalletConnect event
    await calendarWalletService.createWalletConnectEvent(calendarId);

    // Get wallet info for response
    const walletInfo = await calendarWalletService.getWalletInfo(calendarId);

    res.json({
      success: true,
      message: `Fresh start completed - cleared ${clearResult.deleted} events and created fresh WalletConnect event`,
      data: {
        eventsDeleted: clearResult.deleted,
        errors: clearResult.errors,
        walletInfo,
      },
    });
  } catch (error) {
    console.error("Error during fresh start:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Clean up duplicate events
app.post("/cleanup-duplicates/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Get events and count duplicates
    const events = await calendarWalletService.calendarService.getEvents();
    const walletConnectEvents = events.filter((event) =>
      event.summary.toLowerCase().includes("connect to dapp")
    );

    if (walletConnectEvents.length <= 1) {
      res.json({
        success: true,
        message: "No duplicate events found",
        data: { duplicatesFound: 0, duplicatesRemoved: 0 },
      });
      return;
    }

    // Delete all but the most recent
    const sortedEvents = walletConnectEvents.sort(
      (a, b) =>
        new Date(b.start.dateTime || b.start.date || "").getTime() -
        new Date(a.start.dateTime || a.start.date || "").getTime()
    );
    const keepEvent = sortedEvents[0];
    const deleteEvents = sortedEvents.slice(1);

    let deletedCount = 0;
    for (const event of deleteEvents) {
      try {
        await calendarWalletService.calendarService.calendarInstance.events.delete(
          {
            calendarId: calendarId,
            eventId: event.id,
          }
        );
        deletedCount++;
        console.log(`[CLEANUP] Deleted duplicate event ${event.id}`);
      } catch (error) {
        console.error(
          `[CLEANUP] Failed to delete duplicate event ${event.id}:`,
          error
        );
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate events`,
      data: {
        duplicatesFound: walletConnectEvents.length,
        duplicatesRemoved: deletedCount,
        keptEvent: keepEvent.id,
      },
    });
  } catch (error) {
    console.error("Error cleaning up duplicates:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/status", (req, res) => {
  try {
    if (calendarAgent) {
      const status = calendarAgent.getStatus();
      res.json({
        success: true,
        data: status,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Calendar agent not initialized",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Onboarding endpoint to accept shared calendars
app.post("/onboard/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Accept the shared calendar
    await calendarWalletService.calendarService.acceptSharedCalendar(
      calendarId
    );

    // Get wallet info for the new calendar
    const walletInfo = await calendarWalletService.getWalletInfo(calendarId);

    // Attempt to create a unique subname for this calendar (non-blocking)
    let subnameResult = null;
    try {
      console.log(
        `🏷️ Attempting to create subname for onboarded calendar: ${calendarId}`
      );
      subnameResult = await nameStoneService.createSubnameWithRetry(
        calendarId,
        3
      );

      if (subnameResult.success) {
        console.log(
          `✅ Subname created for onboarded calendar: ${subnameResult.subname}`
        );
      } else {
        console.warn(
          `⚠️ Subname creation failed for onboarded calendar: ${subnameResult.message}`
        );
      }
    } catch (error) {
      console.warn(`⚠️ Subname creation error for onboarded calendar:`, error);
    }

    // Save calendar to database
    const savedCalendar = await databaseService.addCalendar({
      calendarId: calendarId,
      summary: `Calendar ${calendarId.split("@")[0]}`,
      walletAddress: walletInfo.address,
      lastBalance: walletInfo.balanceWei,
      isActive: true, // Make this the active calendar
    });

    // Set as active calendar
    await databaseService.setActiveCalendar(calendarId);

    // If no agent is running, start it with this calendar
    if (!calendarAgent) {
      console.log(
        `🚀 Starting Calendar Agent with onboarded calendar: ${calendarId}`
      );
      const config: CalendarAgentConfig = {
        calendarId: calendarId,
        checkIntervalMinutes: 0.083, // 5 seconds (0.083 minutes)
        autoCreateWalletConnectEvent: true,
      };

      calendarAgent = new CalendarAgent(config);
      await calendarAgent.start();
      console.log("✅ Calendar Agent started successfully");
    } else {
      // Switch to the new calendar
      calendarAgent.config.calendarId = calendarId;
      await calendarAgent.processEventsNow();
    }

    res.json({
      success: true,
      message: `Successfully onboarded calendar: ${calendarId}`,
      data: {
        calendarId,
        walletInfo,
        subname: subnameResult?.success ? subnameResult.subname : null,
        subnameStatus: subnameResult?.success ? "created" : "failed",
        agentStarted: !calendarAgent ? false : true,
      },
    });
  } catch (error) {
    console.error("Error onboarding calendar:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all saved calendars from database
app.get("/saved-calendars", async (req, res) => {
  try {
    const calendars = await databaseService.getAllCalendars();

    res.json({
      success: true,
      data: calendars,
    });
  } catch (error) {
    console.error("Error fetching saved calendars:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all accessible calendars
app.get("/calendars", async (req, res) => {
  try {
    const calendars =
      await calendarWalletService.calendarService.getAccessibleCalendars();

    res.json({
      success: true,
      data: calendars.map((cal) => ({
        id: cal.id,
        summary: cal.summary,
        accessRole: cal.accessRole,
        selected: cal.selected,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
      })),
    });
  } catch (error) {
    console.error("Error fetching calendars:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Switch to a different calendar
app.post("/switch-calendar/:calendarId", async (req, res) => {
  try {
    const { calendarId } = req.params;

    if (!calendarId) {
      res.status(400).json({
        success: false,
        error: "Calendar ID is required",
      });
      return;
    }

    // Check if calendar exists in database
    const existingCalendar = await databaseService.getCalendar(calendarId);

    if (!existingCalendar) {
      // Accept the calendar if it's not already accepted
      await calendarWalletService.calendarService.acceptSharedCalendar(
        calendarId
      );

      // Get wallet info and save to database
      const walletInfo = await calendarWalletService.getWalletInfo(calendarId);

      await databaseService.addCalendar({
        calendarId: calendarId,
        summary: `Calendar ${calendarId.split("@")[0]}`,
        walletAddress: walletInfo.address,
        lastBalance: walletInfo.balanceWei,
        isActive: false,
      });
    }

    // Set as active calendar in database
    await databaseService.setActiveCalendar(calendarId);

    // Update the calendar agent configuration
    if (calendarAgent) {
      calendarAgent.config.calendarId = calendarId;
      await calendarAgent.processEventsNow(); // Trigger immediate processing
    }

    // Get wallet info for the switched calendar
    const walletInfo = await calendarWalletService.getWalletInfo(calendarId);

    // Attempt to create a unique subname for this calendar (non-blocking)
    let subnameResult = null;
    try {
      console.log(
        `🏷️ Attempting to create subname for switched calendar: ${calendarId}`
      );
      subnameResult = await nameStoneService.createSubnameWithRetry(
        calendarId,
        3
      );

      if (subnameResult.success) {
        console.log(
          `✅ Subname created for switched calendar: ${subnameResult.subname}`
        );
      } else {
        console.warn(
          `⚠️ Subname creation failed for switched calendar: ${subnameResult.message}`
        );
      }
    } catch (error) {
      console.warn(`⚠️ Subname creation error for switched calendar:`, error);
    }

    res.json({
      success: true,
      message: `Successfully switched to calendar: ${calendarId}`,
      data: {
        calendarId,
        walletInfo,
        subname: subnameResult?.success ? subnameResult.subname : null,
        subnameStatus: subnameResult?.success ? "created" : "failed",
      },
    });
  } catch (error) {
    console.error("Error switching calendar:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Agent API endpoint
app.post("/api/agent", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({
        success: false,
        error: "Message is required",
      });
      return;
    }

    const response = await agent.process({
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      success: true,
      response: response.choices[0].message.content,
    });
  } catch (error) {
    console.error("Agent API error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down Calendar Wallet Agent...");
  if (calendarAgent) {
    calendarAgent.stop();
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down Calendar Wallet Agent...");
  if (calendarAgent) {
    calendarAgent.stop();
  }
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Global error handlers to prevent server crashes
    process.on("uncaughtException", (error) => {
      console.error("🚨 Uncaught Exception:", error);
      console.error("🔄 Server will continue running...");
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
      console.error("🔄 Server will continue running...");
    });

    // Initialize Calendar Agent first
    await initializeCalendarAgent();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Calendar Wallet Agent server running on port ${PORT}`);
      if (calendarAgent) {
        console.log(
          `📅 Monitoring calendar: ${calendarAgent.config.calendarId}`
        );
      } else {
        console.log(
          `📅 No calendar active - use /onboard/{calendarId} to start`
        );
      }
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Status: http://localhost:${PORT}/status`);
      console.log(`📅 Calendars: http://localhost:${PORT}/calendars`);
      console.log(
        `🔗 Test WalletConnect: POST http://localhost:${PORT}/test-walletconnect/{calendarId} with {"uri": "wc:..."}`
      );
      console.log(
        `🔌 Disconnect WalletConnect: POST http://localhost:${PORT}/disconnect-walletconnect/{calendarId}`
      );
      // console.log(
      //   `💰 Wallet info: http://localhost:${PORT}/wallet/{calendarId}`
      // );
      console.log(
        `🚀 Onboard calendar: http://localhost:${PORT}/onboard/{calendarId}`
      );
      console.log(
        `🔄 Switch calendar: http://localhost:${PORT}/switch-calendar/{calendarId}`
      );
      // console.log(
      //   `⚡ Update balance: http://localhost:${PORT}/update-balance/{calendarId}`
      // );
      // console.log(
      //   `🧹 Fresh start: http://localhost:${PORT}/fresh-start/{calendarId}`
      // );
      // console.log(
      //   `💥 Clear all: http://localhost:${PORT}/clear-all/{calendarId}`
      // );
      // console.log(
      //   `🧪 Test Send ETH: http://localhost:${PORT}/test-send/{calendarId} (uses valid test address)`
      // );
      // console.log(
      //   `⚡ Process events: http://localhost:${PORT}/process-events/{calendarId}`
      // );
      // console.log(
      //   `🔍 Debug events: http://localhost:${PORT}/debug-events/{calendarId}`
      // );
      // console.log(`🤖 Agent API: http://localhost:${PORT}/api/agent`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the application
startServer();
