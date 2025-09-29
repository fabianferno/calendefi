import { ethers } from "ethers";
import { CHAIN_CONFIG, MAINNET_CONFIG } from "./chainConfig";
import { SUPPORTED_TOKENS } from "./consts";
import CalendarService, { TransactionEvent } from "./calendarService";
import SwapService from "./swapService";

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  balanceWei: string;
  decimals: number;
}

export interface WalletInfo {
  address: string;
  balance: string;
  balanceWei: string; // Changed from bigint to string for JSON serialization
  explorerUrl: string;
  tokenBalances: TokenBalance[]; // ERC20 token balances
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  explorerUrl?: string;
  status?: string; // For WalletConnect: "pending_approval", "approved", "rejected"
}

export class CalendarWalletService {
  public calendarService: CalendarService; // Make public for access from index.ts
  private provider: ethers.JsonRpcProvider;
  private mainnetProvider: ethers.JsonRpcProvider;
  private walletCache = new Map<string, ethers.Wallet>();
  private walletKit: any = null;
  private walletConnectSessions = new Map<string, any>();
  private lastKnownBalances = new Map<string, string>(); // Track last known balances
  public swapService: SwapService;

  constructor(calendarService?: CalendarService) {
    this.calendarService = calendarService || new CalendarService();
    this.provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrl);
    this.mainnetProvider = new ethers.JsonRpcProvider(MAINNET_CONFIG.rpcUrl);
    this.swapService = new SwapService(this.provider);
  }

  /**
   * Get or generate wallet for a calendar ID
   */
  getWalletForCalendar(calendarId: string): ethers.Wallet {
    if (this.walletCache.has(calendarId)) {
      return this.walletCache.get(calendarId)!;
    }

    const wallet =
      this.calendarService.generateWalletFromCalendarId(calendarId);
    this.walletCache.set(calendarId, wallet);
    return wallet;
  }

  /**
   * Fetch ERC20 token balances for a wallet address
   */
  async fetchTokenBalances(address: string): Promise<TokenBalance[]> {
    const tokenBalances: TokenBalance[] = [];

    // ERC20 ABI for balanceOf and decimals
    const erc20Abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
      "function name() view returns (string)",
    ];

    for (const [symbol, tokenConfig] of Object.entries(SUPPORTED_TOKENS)) {
      try {
        // Skip placeholder/zero addresses
        if (tokenConfig.address === "0x0000000000000000000000000000000000000000") {
          continue;
        }

        const contract = new ethers.Contract(
          tokenConfig.address,
          erc20Abi,
          this.provider
        );

        // Check if contract exists first
        const code = await this.provider.getCode(tokenConfig.address);
        if (code === "0x") {
          console.log(`Token ${symbol} does not exist at ${tokenConfig.address}, skipping`);
          continue;
        }

        // Fetch balance and token info in parallel
        const [balanceWei, decimals, tokenSymbol, tokenName] =
          await Promise.all([
            contract.balanceOf(address),
            contract.decimals(),
            contract.symbol(),
            contract.name(),
          ]);

        // Format balance based on token decimals
        const balance = ethers.formatUnits(balanceWei, decimals);

        // Only include tokens with non-zero balance
        if (balanceWei > 0n) {
          tokenBalances.push({
            symbol: tokenSymbol,
            name: tokenName,
            address: tokenConfig.address,
            balance: `${balance} ${tokenSymbol}`,
            balanceWei: balanceWei.toString(),
            decimals: Number(decimals),
          });
        }
      } catch (error) {
        console.warn(
          `Error fetching balance for ${symbol} (${tokenConfig.address}):`,
          error
        );
        // Continue with other tokens even if one fails
      }
    }

    return tokenBalances;
  }

  /**
   * Get wallet information including balance and ERC20 token balances
   */
  async getWalletInfo(calendarId: string): Promise<WalletInfo> {
    const wallet = this.getWalletForCalendar(calendarId);

    try {
      const [balanceWei, tokenBalances] = await Promise.all([
        this.provider.getBalance(wallet.address),
        this.fetchTokenBalances(wallet.address),
      ]);

      const balance = ethers.formatEther(balanceWei);

      return {
        address: wallet.address,
        balance: `${balance} ${CHAIN_CONFIG.currency}`,
        balanceWei: balanceWei.toString(),
        explorerUrl: `${CHAIN_CONFIG.explorerUrl}/address/${wallet.address}`,
        tokenBalances,
      };
    } catch (error) {
      console.error("Error fetching wallet info:", error);
      throw error;
    }
  }

  /**
   * Execute a WalletConnect transaction
   */
  async executeWalletConnectTransaction(
    calendarId: string,
    transactionEvent: TransactionEvent
  ): Promise<TransactionResult> {
    try {
      const walletConnectUri = transactionEvent.walletConnectUri;

      if (!walletConnectUri) {
        throw new Error("No WalletConnect URI found in event location");
      }

      // Check if this URI has already been processed
      const existingSession = this.walletConnectSessions.get(calendarId);
      if (existingSession && existingSession.uri === walletConnectUri) {
        console.log(
          `[WALLETCONNECT] URI already processed for calendar ${calendarId}, skipping duplicate processing`
        );
        return {
          success: true,
          txHash: "already_processed",
          explorerUrl: undefined,
          status: "already_processed",
        };
      }

      // Initialize WalletConnect if not already done
      await this.initializeWalletConnect();

      // Parse the URI and initiate connection
      const connectionResult = await this.processWalletConnectUri(
        walletConnectUri,
        calendarId
      );

      // For WalletConnect, pairing initiation is not the same as completion
      // We need to wait for user approval in their wallet
      return {
        success: true,
        txHash: "pending_approval", // Indicate that user approval is needed
        explorerUrl: connectionResult.dappUrl,
        status: "pending_approval", // Add status to distinguish from completed transactions
      };
    } catch (error) {
      console.error("Error executing WalletConnect transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Resolve address or ENS name to Ethereum address
   */
  async resolveAddress(input: string): Promise<string> {
    try {
      // Check if it's already a valid Ethereum address
      if (ethers.isAddress(input)) {
        console.log(`[DEBUG] Input is already a valid address: ${input}`);
        return input;
      }

      // Check if it's an ENS name (ends with .eth)
      if (input.endsWith(".eth")) {
        console.log(
          `[DEBUG] Resolving ENS name: ${input} (using mainnet provider)`
        );
        const resolved = await this.mainnetProvider.resolveName(input);
        if (!resolved) {
          throw new Error(`ENS name ${input} could not be resolved on mainnet`);
        }
        console.log(`[DEBUG] ENS name resolved to: ${resolved}`);
        return resolved;
      }

      throw new Error(`Invalid address or ENS name format: ${input}`);
    } catch (error) {
      console.error(`[ERROR] Failed to resolve address/ENS: ${input}`, error);
      throw new Error(
        `Failed to resolve address or ENS name: ${input}. Error: ${error}`
      );
    }
  }

  /**
   * Execute a send transaction
   */
  async executeSendTransaction(
    calendarId: string,
    transactionEvent: TransactionEvent
  ): Promise<TransactionResult> {
    try {
      const wallet = this.getWalletForCalendar(calendarId);
      // Connect wallet to provider for transaction operations
      const connectedWallet = wallet.connect(this.provider);

      // Validate the recipient address first
      if (!transactionEvent.toAddress) {
        throw new Error("No recipient address provided");
      }

      // Resolve address or ENS name to Ethereum address
      const resolvedAddress = await this.resolveAddress(
        transactionEvent.toAddress
      );
      console.log(
        `[DEBUG] Address/ENS resolved: ${transactionEvent.toAddress} -> ${resolvedAddress}`
      );

      const amount = parseFloat(transactionEvent.amount!);

      if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
      }

      // Check if it's a native token (ETH or tRBTC) or ERC-20 token
      if (transactionEvent.token?.toUpperCase() === "ETH" || transactionEvent.token?.toUpperCase() === "TRBTC") {
        // Native ETH transfer - use 18 decimals
        const amountWei = ethers.parseEther(amount.toString());

        const tx = await connectedWallet.sendTransaction({
          to: resolvedAddress,
          value: amountWei,
        });

        const receipt = await tx.wait();
        const txHash = receipt!.hash;

        return {
          success: true,
          txHash,
          explorerUrl: `${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`,
        };
      } else {
        // ERC-20 token transfer - use appropriate decimals
        const tokenAddress =
          CHAIN_CONFIG.tokens[transactionEvent.token!.toUpperCase()];
        if (!tokenAddress) {
          throw new Error(`Token ${transactionEvent.token} not supported`);
        }

        // Get token decimals from SUPPORTED_TOKENS config
        const tokenSymbol = transactionEvent.token!.toUpperCase();
        const tokenConfig =
          SUPPORTED_TOKENS[tokenSymbol as keyof typeof SUPPORTED_TOKENS];

        if (!tokenConfig) {
          throw new Error(`Token configuration not found for ${tokenSymbol}`);
        }

        // Convert amount using correct decimals
        const amountWei = ethers.parseUnits(
          amount.toString(),
          tokenConfig.decimals
        );

        // Check balance before attempting transfer
        const erc20Abi = [
          "function transfer(address to, uint256 amount) returns (bool)",
          "function balanceOf(address owner) view returns (uint256)",
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)",
        ];

        const contract = new ethers.Contract(
          tokenAddress,
          erc20Abi,
          connectedWallet
        );

        // First, check if the contract exists and is callable
        try {
          console.log(`[DEBUG] Checking if contract exists at ${tokenAddress}`);
          const code = await this.provider.getCode(tokenAddress);
          if (code === "0x") {
            throw new Error(
              `No contract found at address ${tokenAddress}. Token ${tokenSymbol} may not exist on this network.`
            );
          }
          console.log(`[DEBUG] Contract exists, code length: ${code.length}`);
        } catch (error) {
          throw new Error(
            `Failed to verify contract at ${tokenAddress}: ${error}`
          );
        }

        // Check wallet balance
        const walletBalance = await contract.balanceOf(connectedWallet.address);
        console.log(
          `[DEBUG] Wallet balance: ${ethers.formatUnits(
            walletBalance,
            tokenConfig.decimals
          )} ${tokenSymbol}`
        );
        console.log(
          `[DEBUG] Attempting to transfer: ${amount} ${tokenSymbol} (${amountWei} wei)`
        );

        if (walletBalance < amountWei) {
          throw new Error(
            `Insufficient ${tokenSymbol} balance. Required: ${amount} ${tokenSymbol}, Available: ${ethers.formatUnits(
              walletBalance,
              tokenConfig.decimals
            )} ${tokenSymbol}`
          );
        }

        // For direct wallet transfers, we use transfer() not transferFrom()
        // transferFrom() is only needed when transferring on behalf of another address
        console.log(
          `[DEBUG] Using direct transfer() method for wallet-to-wallet transfer`
        );
        const tx = await contract.transfer(resolvedAddress, amountWei);
        const receipt = await tx.wait();
        const txHash = receipt!.hash;

        return {
          success: true,
          txHash,
          explorerUrl: `${CHAIN_CONFIG.explorerUrl}/tx/${txHash}`,
        };
      }
    } catch (error) {
      console.error("Error executing send transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Execute a swap transaction
   */
  async executeSwapTransaction(
    calendarId: string,
    transactionEvent: TransactionEvent
  ): Promise<TransactionResult> {
    try {
      const wallet = this.getWalletForCalendar(calendarId);

      // Validate required fields
      if (
        !transactionEvent.amount ||
        !transactionEvent.fromToken ||
        !transactionEvent.toToken
      ) {
        throw new Error(
          "Missing required swap parameters: amount, fromToken, or toToken"
        );
      }

      const amount = parseFloat(transactionEvent.amount);
      if (!amount || amount <= 0) {
        throw new Error("Invalid swap amount");
      }

      console.log(
        `[SWAP] Executing swap: ${amount} ${transactionEvent.fromToken} -> ${transactionEvent.toToken}`
      );

      // Check if pools exist first
      let poolsExist = false;
      try {
        poolsExist = await this.swapService.checkPoolsExist(
          transactionEvent.fromToken!,
          transactionEvent.toToken!
        );
      } catch (checkError) {
        console.error(`[SWAP] Error checking pools:`, checkError);
        throw new Error(
          `Unable to check liquidity pools for ${transactionEvent.fromToken} -> ${transactionEvent.toToken}. This trading pair may not be supported.`
        );
      }

      if (!poolsExist) {
        throw new Error(
          `No liquidity pools available for ${transactionEvent.fromToken} -> ${transactionEvent.toToken} on testnet. This trading pair may not be supported.`
        );
      }

      // Execute swap using SwapService
      const swapResult = await this.swapService.executeSwap({
        fromToken: transactionEvent.fromToken!,
        toToken: transactionEvent.toToken!,
        amount: transactionEvent.amount!,
        slippagePct: transactionEvent.slippagePct || 2, // Use specified slippage or default 2%
        walletAddress: wallet.address,
        privateKey: wallet.privateKey,
      });

      if (swapResult.success) {
        console.log(`[SWAP] Swap successful: ${swapResult.txHash}`);
        return {
          success: true,
          txHash: swapResult.txHash,
          explorerUrl: swapResult.explorerUrl,
        };
      } else {
        console.error(`[SWAP] Swap failed: ${swapResult.error}`);
        return {
          success: false,
          error: swapResult.error,
        };
      }
    } catch (error) {
      console.error("Error executing swap transaction:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process a transaction event
   */
  async processTransactionEvent(
    calendarId: string,
    transactionEvent: TransactionEvent
  ): Promise<TransactionResult> {
    try {
      // Check if approval is required and if it's been given
      if (transactionEvent.requiresApproval) {
        const approval = await this.calendarService.checkEventApproval(
          transactionEvent.eventId
        );

        if (!approval.approved) {
          await this.calendarService.updateEventStatus(
            transactionEvent.eventId,
            "pending_approval",
            `Waiting for approval: ${approval.voteCount}/${approval.totalAttendees} votes`
          );
          return {
            success: false,
            error: "Insufficient approval votes",
          };
        }
      }

      // Update status to executing
      await this.calendarService.updateEventStatus(
        transactionEvent.eventId,
        "executing",
        "Transaction is being processed..."
      );

      let result: TransactionResult;

      switch (transactionEvent.type) {
        case "send":
          result = await this.executeSendTransaction(
            calendarId,
            transactionEvent
          );
          break;
        case "swap":
          result = await this.executeSwapTransaction(
            calendarId,
            transactionEvent
          );
          break;
        case "connect":
          result = await this.executeWalletConnectTransaction(
            calendarId,
            transactionEvent
          );
          break;
        default:
          result = { success: false, error: "Unknown transaction type" };
      }

      // Update event status with result
      if (result.success) {
        if (result.status === "pending_approval") {
          // For WalletConnect, show pending approval status
          await this.calendarService.updateEventStatus(
            transactionEvent.eventId,
            "pending_approval",
            `WalletConnect pairing initiated. Please approve the connection in your wallet app.\n\nCheck your wallet app (MetaMask, Trust Wallet, etc.) to approve the connection to the dApp.`
          );
        } else if (result.status === "already_processed") {
          // Skip updating status for already processed WalletConnect URIs
          console.log(
            `[WALLETCONNECT] Skipping status update for already processed URI`
          );
        } else {
          // For regular transactions, mark as executed
          await this.calendarService.updateEventStatus(
            transactionEvent.eventId,
            "executed",
            `Transaction successful! Hash: ${result.txHash}\nExplorer: ${result.explorerUrl}`
          );
        }
      } else {
        await this.calendarService.updateEventStatus(
          transactionEvent.eventId,
          "failed",
          `Transaction failed: ${result.error}`
        );
      }

      return result;
    } catch (error) {
      console.error("Error processing transaction event:", error);
      await this.calendarService.updateEventStatus(
        transactionEvent.eventId,
        "error",
        `Processing error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check and process all pending events
   */
  async processPendingEvents(calendarId: string): Promise<void> {
    try {
      const eventsToExecute = await this.calendarService.getEventsToExecute();

      for (const event of eventsToExecute) {
        // Skip if already processed
        const eventDetails =
          await this.calendarService.calendarInstance.events.get({
            calendarId: this.calendarService.currentCalendarId,
            eventId: event.eventId,
          });

        // Check both title and description for execution status
        const title = eventDetails.data.summary || "";
        const description = eventDetails.data.description || "";

        if (
          title.startsWith("[EXECUTED]") ||
          title.startsWith("[FAILED]") ||
          title.startsWith("[ERROR]") ||
          description.includes("Status: executed") ||
          description.includes("Status: failed") ||
          description.includes("Status: error") ||
          description.includes("Status: pending_approval")
        ) {
          continue;
        }

        console.log(`Processing event: ${event.eventTitle}`);
        const result = await this.processTransactionEvent(calendarId, event);
        console.log(`Transaction result:`, result);
      }
    } catch (error) {
      console.error("Error processing pending events:", error);
    }
  }

  /**
   * Update WalletConnect events with current wallet info including ERC20 token balances
   */
  async updateWalletConnectEvents(calendarId: string): Promise<void> {
    try {
      const events = await this.calendarService.getEvents();
      const walletInfo = await this.getWalletInfo(calendarId);

      for (const event of events) {
        if (event.summary.toLowerCase().includes("connect to dapp")) {
          await this.calendarService.updateWalletConnectEvent(
            event.id,
            walletInfo.address,
            walletInfo.balance,
            walletInfo.tokenBalances
          );
        }
      }
    } catch (error) {
      console.error("Error updating WalletConnect events:", error);
    }
  }

  /**
   * Create a new WalletConnect event
   */
  async createWalletConnectEvent(calendarId: string): Promise<void> {
    try {
      const walletInfo = await this.getWalletInfo(calendarId);
      await this.calendarService.createWalletConnectEvent(
        calendarId,
        walletInfo.address,
        walletInfo.balance,
        walletInfo.tokenBalances
      );

      // Store the initial balance
      this.lastKnownBalances.set(calendarId, walletInfo.balanceWei);
    } catch (error) {
      console.error("Error creating WalletConnect event:", error);
    }
  }

  /**
   * Check if balance has changed and update WalletConnect events if needed
   */
  async checkAndUpdateBalanceIfChanged(calendarId: string): Promise<boolean> {
    try {
      const walletInfo = await this.getWalletInfo(calendarId);
      const currentBalance = walletInfo.balanceWei;
      const lastKnownBalance = this.lastKnownBalances.get(calendarId);

      // If balance has changed, update the calendar
      if (
        lastKnownBalance === undefined ||
        currentBalance !== lastKnownBalance
      ) {
        console.log(
          `[BALANCE] Balance changed for calendar ${calendarId}: ${
            lastKnownBalance || "0"
          } → ${currentBalance} wei`
        );

        // Update the WalletConnect events with new balance
        await this.updateWalletConnectEvents(calendarId);

        // Store the new balance
        this.lastKnownBalances.set(calendarId, currentBalance);

        return true; // Balance was updated
      }

      return false; // No balance change
    } catch (error) {
      console.error("Error checking balance change:", error);
      return false;
    }
  }

  /**
   * Initialize WalletConnect
   */
  private async initializeWalletConnect(): Promise<void> {
    if (this.walletKit) {
      return; // Already initialized
    }

    try {
      console.log("[WALLETCONNECT] Starting initialization...");

      // Check if we have a project ID
      const projectId = process.env.WALLETCONNECT_PROJECT_ID;
      if (!projectId || projectId === "your_walletconnect_project_id_here") {
        console.warn(
          "[WALLETCONNECT] Warning: WALLETCONNECT_PROJECT_ID not set. Using demo project ID."
        );
        process.env.WALLETCONNECT_PROJECT_ID =
          "3f0e0c7b5c9f4a1b2d3e4f5a6b7c8d9e";
      }

      const { Core } = await import("@walletconnect/core");
      const { WalletKit } = await import("@reown/walletkit");

      console.log("[WALLETCONNECT] Initializing Core...");
      // Initialize Core first
      const core = new Core({
        projectId: process.env.WALLETCONNECT_PROJECT_ID,
      });

      console.log("[WALLETCONNECT] Initializing WalletKit...");
      // Initialize WalletKit with 2025 API
      this.walletKit = await WalletKit.init({
        core,
        metadata: {
          name: "Calendar Wallet Agent",
          description: "Calendar-based wallet agent with WalletConnect for EVM",
          url: "https://calendar-wallet-agent.com",
          icons: ["https://calendar-wallet-agent.com/icon.png"],
        },
      });

      // Handle session proposals
      this.walletKit.on("session_proposal", async (proposal: any) => {
        console.log("Session proposal received:", proposal);

        // Find the calendar ID for this session
        const pairingTopic = proposal.params.pairingTopic;
        let calendarId = null;

        // Find calendar by pairing topic
        for (const [calId, session] of this.walletConnectSessions.entries()) {
          if (session.uri.includes(pairingTopic)) {
            calendarId = calId;
            break;
          }
        }

        if (calendarId) {
          // Update session with topic
          const session = this.walletConnectSessions.get(calendarId);
          if (session) {
            session.topic = proposal.params.id;
            session.status = "proposed";
            this.walletConnectSessions.set(calendarId, session);
            console.log(
              `[WALLETCONNECT] Updated session for calendar ${calendarId} with topic: ${
                proposal.params.id
              } (type: ${typeof proposal.params.id})`
            );
            console.log(`[WALLETCONNECT] Session object:`, session);

            // Automatically approve the session proposal
            try {
              console.log(
                `[WALLETCONNECT] Auto-approving session proposal for calendar ${calendarId}`
              );

              // Get the chain ID and methods from the proposal
              // Check both required and optional namespaces
              const requiredNamespaces = proposal.params.requiredNamespaces;
              const optionalNamespaces = proposal.params.optionalNamespaces;

              // Use required namespaces first, fall back to optional namespaces
              let eip155Namespace = requiredNamespaces.eip155;
              if (!eip155Namespace && optionalNamespaces.eip155) {
                // Handle optional namespaces - they might be an array or object
                const optionalEip155 = optionalNamespaces.eip155;
                eip155Namespace = Array.isArray(optionalEip155)
                  ? optionalEip155[0]
                  : optionalEip155;
              }

              // If still no namespace, create a default one
              if (!eip155Namespace) {
                eip155Namespace = {
                  chains: [`eip155:${CHAIN_CONFIG.chainId}`],
                  methods: [
                    "eth_sendTransaction",
                    "eth_signTransaction",
                    "eth_sign",
                    "personal_sign",
                    "eth_signTypedData",
                  ],
                  events: ["chainChanged", "accountsChanged"],
                };
              }

              const requiredChains = eip155Namespace.chains || [];
              const requiredChainId =
                requiredChains[0] || `eip155:${CHAIN_CONFIG.chainId}`; // fallback to current chain
              const requiredMethods = eip155Namespace.methods || [];
              const requiredEvents = eip155Namespace.events || [];

              console.log(
                `[WALLETCONNECT] Using required chain ID: ${requiredChainId}`
              );
              console.log(`[WALLETCONNECT] Required methods:`, requiredMethods);
              console.log(`[WALLETCONNECT] Required events:`, requiredEvents);

              const approvalResult = await this.walletKit.approveSession({
                id: proposal.id,
                namespaces: {
                  eip155: {
                    accounts: [
                      `${requiredChainId}:${
                        this.getWalletForCalendar(calendarId).address
                      }`,
                    ],
                    methods: requiredMethods,
                    events: requiredEvents,
                  },
                },
              });
              console.log(
                `[WALLETCONNECT] Session approved successfully for calendar ${calendarId}`,
                approvalResult
              );

              // Update session with the final approved topic
              const approvedSession =
                this.walletConnectSessions.get(calendarId);
              if (approvedSession && approvalResult.topic) {
                approvedSession.topic = approvalResult.topic;
                approvedSession.status = "approved";
                this.walletConnectSessions.set(calendarId, approvedSession);
                console.log(
                  `[WALLETCONNECT] Updated session topic to approved topic: ${approvalResult.topic}`
                );
              }

              // Update calendar event immediately after successful approval
              try {
                const events = await this.calendarService.getEvents();
                const walletConnectEvent = events.find(
                  (event) =>
                    event.summary.toLowerCase().includes("connect to dapp") &&
                    !event.summary.startsWith("[executed]") &&
                    !event.summary.startsWith("[failed]")
                );

                if (walletConnectEvent) {
                  await this.calendarService.updateEventStatus(
                    walletConnectEvent.id,
                    "executed",
                    `WalletConnect connection established successfully!\n\nSession Topic: ${
                      proposal.params.id
                    }\nConnected to: ${
                      proposal.params.proposer?.metadata?.name || "Unknown dApp"
                    }\nLast Updated: ${new Date().toISOString()}`
                  );
                  console.log(
                    `[WALLETCONNECT] Updated calendar event ${walletConnectEvent.id} to executed status immediately after approval`
                  );
                }
              } catch (error) {
                console.error(
                  "[WALLETCONNECT] Error updating calendar event immediately after approval:",
                  error
                );
              }
            } catch (error) {
              console.error(`[WALLETCONNECT] Error approving session:`, error);
            }
          }
        }
      });

      // Handle session approval
      this.walletKit.on("session_approve", async (session: any) => {
        console.log("Session approved:", session);
        // Update session status to approved
        for (const [
          calendarId,
          sessionData,
        ] of this.walletConnectSessions.entries()) {
          if (sessionData.topic === session.topic) {
            sessionData.status = "approved";
            this.walletConnectSessions.set(calendarId, sessionData);
            console.log(
              `[WALLETCONNECT] Session approved for calendar ${calendarId}`
            );

            // Update the calendar event status to executed
            try {
              const events = await this.calendarService.getEvents();
              const walletConnectEvent = events.find(
                (event) =>
                  event.summary.toLowerCase().includes("connect to dapp") &&
                  !event.summary.startsWith("[executed]") &&
                  !event.summary.startsWith("[failed]")
              );

              if (walletConnectEvent) {
                await this.calendarService.updateEventStatus(
                  walletConnectEvent.id,
                  "executed",
                  `WalletConnect connection established successfully!\n\nSession Topic: ${
                    session.topic
                  }\nConnected to: ${
                    session.peer?.metadata?.name || "Unknown dApp"
                  }\nLast Updated: ${new Date().toISOString()}`
                );
                console.log(
                  `[WALLETCONNECT] Updated calendar event ${walletConnectEvent.id} to executed status`
                );
              }
            } catch (error) {
              console.error(
                "[WALLETCONNECT] Error updating calendar event after approval:",
                error
              );
            }
            break;
          }
        }
      });

      // Handle session rejection
      this.walletKit.on("session_reject", async (session: any) => {
        console.log("Session rejected:", session);
        // Update session status to rejected
        for (const [
          calendarId,
          sessionData,
        ] of this.walletConnectSessions.entries()) {
          if (sessionData.topic === session.topic) {
            sessionData.status = "rejected";
            this.walletConnectSessions.set(calendarId, sessionData);
            console.log(
              `[WALLETCONNECT] Session rejected for calendar ${calendarId}`
            );

            // Update the calendar event status to failed
            try {
              const events = await this.calendarService.getEvents();
              const walletConnectEvent = events.find(
                (event) =>
                  event.summary.toLowerCase().includes("connect to dapp") &&
                  !event.summary.startsWith("[executed]") &&
                  !event.summary.startsWith("[failed]")
              );

              if (walletConnectEvent) {
                await this.calendarService.updateEventStatus(
                  walletConnectEvent.id,
                  "failed",
                  `WalletConnect connection was rejected by the user.\n\nPlease try connecting again by updating the WalletConnect URI in the location field.\nLast Updated: ${new Date().toISOString()}`
                );
                console.log(
                  `[WALLETCONNECT] Updated calendar event ${walletConnectEvent.id} to failed status`
                );
              }
            } catch (error) {
              console.error(
                "[WALLETCONNECT] Error updating calendar event after rejection:",
                error
              );
            }
            break;
          }
        }
      });

      // Handle session requests (transactions, messages, etc.)
      this.walletKit.on("session_request", async (request: any) => {
        console.log("Session request received:", request);
        // Handle transaction requests from dApps
        await this.handleSessionRequest(request);
      });

      console.log("WalletConnect initialized successfully");
    } catch (error) {
      console.error("Failed to initialize WalletConnect:", error);
      throw error;
    }
  }

  /**
   * Process WalletConnect URI
   */
  private async processWalletConnectUri(
    uri: string,
    calendarId: string
  ): Promise<any> {
    try {
      console.log(
        `[WALLETCONNECT] Processing URI for calendar ${calendarId}:`,
        uri
      );

      if (!this.walletKit) {
        throw new Error("WalletConnect not initialized");
      }

      // Use real WalletConnect pairing
      console.log("[WALLETCONNECT] Attempting to pair...");
      await this.walletKit.core.pairing.pair({ uri });
      console.log("[WALLETCONNECT] Pairing initiated successfully");

      // Store the pending connection
      // Clear any existing session for this calendar first
      if (this.walletConnectSessions.has(calendarId)) {
        console.log(
          `[WALLETCONNECT] Clearing existing session for calendar ${calendarId}`
        );
        this.walletConnectSessions.delete(calendarId);
      }

      this.walletConnectSessions.set(calendarId, {
        uri,
        status: "pending",
        createdAt: Date.now(),
        topic: null, // Will be set when session is established
      });

      console.log(
        `[WALLETCONNECT] Stored new session for calendar ${calendarId}. Total sessions: ${this.walletConnectSessions.size}`
      );

      return {
        status: "paired",
        message:
          "WalletConnect pairing initiated. Waiting for dApp approval...",
      };
    } catch (error) {
      console.error("[WALLETCONNECT] Error processing URI:", error);
      throw error;
    }
  }

  /**
   * Handle session requests from dApps
   */
  private async handleSessionRequest(request: any): Promise<void> {
    try {
      console.log(`[WALLETCONNECT] Handling session request:`, request);

      const method = request.params.request.method;
      const params = request.params.request.params;

      // Find which calendar this session belongs to
      const calendarId = this.findCalendarBySession(request.topic);
      if (!calendarId) {
        console.error("No calendar found for session topic:", request.topic);
        return;
      }

      const wallet = this.getWalletForCalendar(calendarId);
      // Connect wallet to provider for transaction operations
      const connectedWallet = wallet.connect(this.provider);
      let result;

      if (method === "eth_sendTransaction") {
        // Send transaction using ethers.js
        console.log(
          `[WALLETCONNECT] Sending transaction from ${connectedWallet.address}`
        );
        const tx = await connectedWallet.sendTransaction(params[0]);
        result = tx.hash;
      } else if (method === "eth_signTransaction") {
        // Sign transaction using ethers.js
        const signedTx = await connectedWallet.signTransaction(params[0]);
        result = signedTx;
      } else if (method === "personal_sign") {
        // Sign message using ethers.js
        const message = params[0];
        const signature = await connectedWallet.signMessage(message);
        result = signature;
      } else if (method === "eth_signTypedData") {
        // Sign typed data using ethers.js
        const signature = await connectedWallet.signTypedData(
          params[0],
          params[1],
          params[2]
        );
        result = signature;
      } else if (method === "eth_accounts") {
        // Return account information
        result = [connectedWallet.address];
      } else if (method === "eth_requestAccounts") {
        // Return account information
        result = [connectedWallet.address];
      } else if (method === "eth_getBalance") {
        // Get balance
        const balance = await this.provider.getBalance(connectedWallet.address);
        result = balance.toString();
      } else if (method === "wallet_switchEthereumChain") {
        // Handle chain switching
        const requestedChainId = params[0].chainId;
        const currentChainId = `0x${CHAIN_CONFIG.chainId.toString(16)}`;

        console.log(
          `[WALLETCONNECT] Chain switch requested to: ${requestedChainId} (current: ${currentChainId})`
        );

        // If the requested chain matches our current chain, return success
        if (
          requestedChainId === currentChainId ||
          requestedChainId === CHAIN_CONFIG.chainId.toString()
        ) {
          console.log(
            `[WALLETCONNECT] Chain switch approved - already on correct chain`
          );
          result = null; // Success response
        } else {
          // Return an error for unsupported chains
          console.log(
            `[WALLETCONNECT] Chain switch rejected - unsupported chain ${requestedChainId}`
          );
          throw new Error(
            `Unsupported chain: ${requestedChainId}. Calendar wallet only supports chain ${currentChainId}`
          );
        }
      } else if (method === "wallet_addEthereumChain") {
        // Handle adding new chains - for calendar wallet, we just acknowledge it
        console.log(
          `[WALLETCONNECT] Add chain requested: ${params[0].chainName}`
        );
        result = null; // Success response
      }

      // Respond to the request
      await this.walletKit.respondSessionRequest({
        topic: request.topic,
        response: {
          id: request.id,
          result,
          jsonrpc: "2.0",
        },
      });

      console.log(`[WALLETCONNECT] Successfully handled ${method} request`);
    } catch (error) {
      console.error("Error handling session request:", error);

      // Send error response with proper error codes for different scenarios
      if (this.walletKit && request) {
        let errorCode = 5000;
        let errorMessage = "Internal error";

        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes("Unsupported chain")) {
            errorCode = 4902; // User rejected the request
            errorMessage = "Unsupported chain";
          } else if (error.message.includes("User rejected")) {
            errorCode = 4001; // User rejected the request
            errorMessage = "User rejected the request";
          }
        }

        await this.walletKit.respondSessionRequest({
          topic: request.topic,
          response: {
            id: request.id,
            jsonrpc: "2.0",
            error: {
              code: errorCode,
              message: errorMessage,
            },
          },
        });
      }
    }
  }

  /**
   * Find calendar ID by session topic
   */
  private findCalendarBySession(topic: string): string | null {
    console.log(
      `[WALLETCONNECT] Looking for calendar with session topic: ${topic}`
    );
    console.log(
      `[WALLETCONNECT] Available sessions:`,
      Array.from(this.walletConnectSessions.entries()).map(
        ([calId, session]) => ({
          calendarId: calId,
          topic: session.topic,
          status: session.status,
        })
      )
    );

    for (const [calendarId, session] of this.walletConnectSessions.entries()) {
      if (session.topic === topic) {
        console.log(`[WALLETCONNECT] Found matching calendar: ${calendarId}`);
        return calendarId;
      }
    }

    // If no exact match, try to find by any active session for the only calendar
    // This is a fallback for when session topics don't match exactly
    if (this.walletConnectSessions.size === 1) {
      const entry = this.walletConnectSessions.entries().next().value;
      if (entry) {
        const [calendarId, session] = entry;
        console.log(
          `[WALLETCONNECT] Using fallback: single calendar ${calendarId} for topic ${topic}`
        );
        return calendarId;
      }
    }

    console.log(
      `[WALLETCONNECT] No calendar found for session topic: ${topic}`
    );
    return null;
  }

  /**
   * Disconnect WalletConnect session for a calendar
   */
  async disconnectWalletConnect(calendarId: string): Promise<boolean> {
    try {
      console.log(
        `[WALLETCONNECT] Disconnecting session for calendar: ${calendarId}`
      );

      if (!this.walletKit) {
        console.log(
          "[WALLETCONNECT] WalletConnect not initialized, nothing to disconnect"
        );
        return true;
      }

      // Find the session for this calendar
      const session = this.walletConnectSessions.get(calendarId);
      if (!session) {
        console.log(
          `[WALLETCONNECT] No active session found for calendar: ${calendarId}`
        );
        return true;
      }

      // Disconnect the session
      if (session.topic) {
        try {
          await this.walletKit.disconnectSession({
            topic: session.topic,
            reason: {
              code: 6000,
              message: "User disconnected via calendar event deletion",
            },
          });
          console.log(
            `[WALLETCONNECT] Successfully disconnected session: ${session.topic}`
          );
        } catch (error) {
          console.log(
            `[WALLETCONNECT] Session may already be disconnected:`,
            error
          );
        }
      }

      // Remove from our tracking
      this.walletConnectSessions.delete(calendarId);
      console.log(
        `[WALLETCONNECT] Removed session tracking for calendar: ${calendarId}`
      );

      return true;
    } catch (error) {
      console.error("[WALLETCONNECT] Error disconnecting session:", error);
      return false;
    }
  }

  /**
   * Check for deleted WalletConnect events and disconnect sessions
   */
  async checkForDeletedWalletConnectEvents(
    calendarId: string
  ): Promise<boolean> {
    try {
      const events = await this.calendarService.getEvents();
      const walletConnectEvents = events.filter((event) =>
        event.summary.toLowerCase().includes("connect to dapp")
      );

      // If no WalletConnect events exist, disconnect any active sessions
      if (walletConnectEvents.length === 0) {
        console.log(
          "[WALLETCONNECT] No WalletConnect events found, checking for active sessions to disconnect"
        );
        const wasDisconnected = await this.disconnectWalletConnect(calendarId);

        if (wasDisconnected) {
          console.log(
            "[WALLETCONNECT] Session disconnected, will create fresh WalletConnect event"
          );
          return true; // Indicates a disconnection occurred
        }
      }

      return false; // No disconnection occurred
    } catch (error) {
      console.error(
        "[WALLETCONNECT] Error checking for deleted WalletConnect events:",
        error
      );
      return false;
    }
  }
}

export default CalendarWalletService;
