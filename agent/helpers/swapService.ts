import { ethers } from "ethers";
import { CHAIN_CONFIG } from "./chainConfig";
import { Token, CurrencyAmount, TradeType, Percent } from "@uniswap/sdk-core";
import { Pool, Route, Trade, SwapQuoter } from "@uniswap/v3-sdk";

export interface SwapOptions {
  fromToken: string;
  toToken: string;
  amount: string;
  slippagePct?: number;
  walletAddress: string;
  privateKey: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  amountDeposited?: number;
  amountReceived?: number;
  price?: number;
  fee?: number;
  error?: string;
  explorerUrl?: string;
}

export class SwapService {
  private provider: ethers.JsonRpcProvider;
  private quoterContract: ethers.Contract;
  private routerContract: ethers.Contract;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;

    // Initialize Uniswap V3 contracts
    const quoterAbi = [
      "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)",
    ];

    const routerAbi = [
      "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut)",
    ];

    this.quoterContract = new ethers.Contract(
      CHAIN_CONFIG.dexConfig!.quoterAddress!,
      quoterAbi,
      provider
    );

    this.routerContract = new ethers.Contract(
      CHAIN_CONFIG.dexConfig!.routerAddress,
      routerAbi,
      provider
    );
  }

  /**
   * Get token by symbol
   */
  getToken(symbol: string): Token {
    const tokenAddress = CHAIN_CONFIG.tokens[symbol.toUpperCase()];
    if (!tokenAddress) {
      throw new Error(
        `Unknown token symbol: ${symbol}. Supported tokens: ${Object.keys(
          CHAIN_CONFIG.tokens
        ).join(", ")}`
      );
    }

    // Create Token instance with chain ID and decimals
    return new Token(
      CHAIN_CONFIG.chainId,
      tokenAddress,
      18, // Most ERC-20 tokens use 18 decimals
      symbol.toUpperCase(),
      symbol.toUpperCase()
    );
  }

  /**
   * Check if user has token balance
   */
  async hasTokenBalance(token: Token, address: string): Promise<boolean> {
    try {
      const erc20Abi = [
        "function balanceOf(address owner) view returns (uint256)",
      ];
      const contract = new ethers.Contract(
        token.address,
        erc20Abi,
        this.provider
      );
      const balance = await contract.balanceOf(address);
      return balance > 0n;
    } catch (error) {
      console.error(`Error checking token balance for ${token.symbol}:`, error);
      return false;
    }
  }

  /**
   * Get quote for a token swap
   */
  async getQuote(
    fromToken: Token,
    toToken: Token,
    amountIn: bigint,
    fee: number = 3000 // 0.3% fee tier
  ): Promise<bigint> {
    try {
      console.log(
        `[SWAP] Getting quote: ${fromToken.symbol} -> ${toToken.symbol}`
      );

      const amountOut =
        await this.quoterContract.quoteExactInputSingle.staticCall(
          fromToken.address,
          toToken.address,
          fee,
          amountIn,
          0 // sqrtPriceLimitX96 = 0 (no limit)
        );

      console.log(
        `[SWAP] Quote: ${ethers.formatEther(amountIn)} ${
          fromToken.symbol
        } -> ${ethers.formatEther(amountOut)} ${toToken.symbol}`
      );
      return amountOut;
    } catch (error) {
      console.error(`[SWAP] Error getting quote:`, error);
      throw new Error(
        `Failed to get quote for ${fromToken.symbol} -> ${toToken.symbol}: ${error}`
      );
    }
  }

  /**
   * Execute a swap transaction
   */
  async executeSwap(options: SwapOptions): Promise<SwapResult> {
    try {
      console.log(
        `[SWAP] Starting swap: ${options.amount} ${options.fromToken} -> ${options.toToken}`
      );

      // Get tokens
      const fromToken = this.getToken(options.fromToken);
      const toToken = this.getToken(options.toToken);

      console.log(
        `[SWAP] From token: ${fromToken.symbol}, To token: ${toToken.symbol}`
      );

      // Convert amount to wei
      const amountIn = ethers.parseEther(options.amount);
      console.log(`[SWAP] Amount in wei: ${amountIn}`);

      // Get quote
      const amountOut = await this.getQuote(fromToken, toToken, amountIn);

      // Calculate minimum amount out with slippage
      const slippagePercent = options.slippagePct || 2;
      const slippage = new Percent(slippagePercent, 100);
      const minimumAmountOut =
        (amountOut * (100n - BigInt(slippagePercent))) / 100n;

      console.log(
        `[SWAP] Expected output: ${ethers.formatEther(amountOut)} ${
          toToken.symbol
        }`
      );
      console.log(
        `[SWAP] Minimum output (${slippagePercent}% slippage): ${ethers.formatEther(
          minimumAmountOut
        )} ${toToken.symbol}`
      );

      // Create wallet from private key
      const wallet = new ethers.Wallet(options.privateKey, this.provider);

      // Connect contracts to wallet
      const routerWithSigner = this.routerContract.connect(wallet);

      // Prepare swap parameters
      const swapParams = {
        tokenIn: fromToken.address,
        tokenOut: toToken.address,
        fee: 3000, // 0.3% fee tier
        recipient: options.walletAddress,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes
        amountIn: amountIn,
        amountOutMinimum: minimumAmountOut,
        sqrtPriceLimitX96: 0, // No price limit
      };

      console.log(`[SWAP] Executing swap with parameters:`, swapParams);

      // Execute swap
      const tx = await (routerWithSigner as any).exactInputSingle(swapParams);
      console.log(`[SWAP] Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`[SWAP] Transaction confirmed: ${tx.hash}`);

      return {
        success: true,
        txHash: tx.hash,
        amountDeposited: parseFloat(ethers.formatEther(amountIn)),
        amountReceived: parseFloat(ethers.formatEther(amountOut)),
        explorerUrl: `${CHAIN_CONFIG.explorerUrl}/tx/${tx.hash}`,
      };
    } catch (error) {
      console.error(`[SWAP] Error executing swap:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if pools exist for a trading pair
   */
  async checkPoolsExist(fromToken: string, toToken: string): Promise<boolean> {
    try {
      console.log(`[CHECK] Checking pools for ${fromToken} -> ${toToken}`);
      const fromTokenObj = this.getToken(fromToken);
      const toTokenObj = this.getToken(toToken);

      // Try to get a quote with a small amount
      const testAmount = ethers.parseEther("0.001");
      await this.getQuote(fromTokenObj, toTokenObj, testAmount);

      console.log(`[CHECK] Pools exist for ${fromToken} -> ${toToken}`);
      return true;
    } catch (error) {
      console.log(
        `[CHECK] No pools available for ${fromToken} -> ${toToken}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get available pools for a token pair
   */
  async getAvailablePools(fromToken: string, toToken: string): Promise<any[]> {
    try {
      const fromTokenObj = this.getToken(fromToken);
      const toTokenObj = this.getToken(toToken);

      // For Uniswap V3, we return the available fee tiers
      const feeTiers = [500, 3000, 10000]; // 0.05%, 0.3%, 1%
      const pools = [];

      for (const fee of feeTiers) {
        try {
          const testAmount = ethers.parseEther("0.001");
          await this.getQuote(fromTokenObj, toTokenObj, testAmount, fee);
          pools.push({
            fee: fee,
            feePercent: fee / 10000,
            fromToken: fromTokenObj.symbol,
            toToken: toTokenObj.symbol,
          });
        } catch (error) {
          // Pool doesn't exist for this fee tier
        }
      }

      return pools;
    } catch (error) {
      console.error(`[SWAP] Error getting pools:`, error);
      return [];
    }
  }

  /**
   * Discover available assets by checking configured tokens
   */
  async discoverAvailableAssets(): Promise<{ [symbol: string]: string }> {
    const availableAssets: { [symbol: string]: string } = {};

    for (const [symbol, address] of Object.entries(CHAIN_CONFIG.tokens)) {
      try {
        // Check if token contract exists
        const code = await this.provider.getCode(address);
        if (code && code !== "0x") {
          availableAssets[symbol] = address;
          console.log(`[DISCOVERY] Found token: ${symbol} (${address})`);
        }
      } catch (error) {
        console.log(`[DISCOVERY] Token ${symbol} (${address}) not found`);
      }
    }

    return availableAssets;
  }

  /**
   * Test if we can fetch native token (ETH)
   */
  async testNativeToken(): Promise<boolean> {
    try {
      const balance = await this.provider.getBalance(
        "0x0000000000000000000000000000000000000000"
      );
      console.log(`[TEST] Native token (ETH) accessible`);
      return true;
    } catch (error) {
      console.error(`[TEST] Failed to access native token:`, error);
      return false;
    }
  }
}

export default SwapService;
