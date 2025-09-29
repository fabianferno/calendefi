// EVM Chain Configuration
export interface ChainConfig {
  chainId: number;
  name: string;
  currency: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
  // DEX configuration
  dexConfig?: {
    name: string;
    routerAddress: string;
    factoryAddress: string;
    quoterAddress?: string;
  };
  // Common token addresses
  tokens: {
    [symbol: string]: string; // token address
  };
}

// Sepolia Testnet Configuration (default)
export const SEPOLIA_CONFIG: ChainConfig = {
  chainId: 11155111,
  name: "Sepolia Testnet",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
  dexConfig: {
    name: "Uniswap V3",
    routerAddress: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E", // Uniswap V3 Router on Sepolia
    factoryAddress: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c", // Uniswap V3 Factory on Sepolia
    quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", // Uniswap V3 Quoter on Sepolia
  },
  tokens: {
    WETH: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // WETH on Sepolia
    USDC: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // USDC on Sepolia
    USDT: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // USDT on Sepolia
    DAI: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", // DAI on Sepolia
    PYUSD: "0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9", // PYUSD on Sepolia
  },
};

// Mainnet Configuration (for future use)
export const MAINNET_CONFIG: ChainConfig = {
  chainId: 1,
  name: "Ethereum Mainnet",
  currency: "ETH",
  explorerUrl: "https://etherscan.io",
  rpcUrl: process.env.MAINNET_RPC_URL || "https://eth.llamarpc.com",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorerUrls: ["https://etherscan.io"],
  dexConfig: {
    name: "Uniswap V3",
    routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 Router
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory
    quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", // Uniswap V3 Quoter
  },
  tokens: {
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    USDC: "0xA0b86a33E6441b8c4C8C0E4A0b8c4C8C0E4A0b8c", // USDC
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
  },
};

// Polygon Configuration (for future use)
export const POLYGON_CONFIG: ChainConfig = {
  chainId: 137,
  name: "Polygon",
  currency: "MATIC",
  explorerUrl: "https://polygonscan.com",
  rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
  nativeCurrency: {
    name: "Polygon",
    symbol: "MATIC",
    decimals: 18,
  },
  blockExplorerUrls: ["https://polygonscan.com"],
  dexConfig: {
    name: "Uniswap V3",
    routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 Router on Polygon
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Polygon
    quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", // Uniswap V3 Quoter on Polygon
  },
  tokens: {
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI
  },
};

// Avalanche Fuji Testnet Configuration
export const AVALANCHE_FUJI_CONFIG: ChainConfig = {
  chainId: 43113,
  name: "Avalanche Fuji Testnet",
  currency: "AVAX",
  explorerUrl: "https://testnet.snowtrace.io",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  nativeCurrency: {
    name: "Avalanche",
    symbol: "AVAX",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.snowtrace.io"],
  dexConfig: {
    name: "Uniswap V3",
    routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
  },
  tokens: {
    WAVAX: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c", // Wrapped AVAX
    USDC: "0x5425890298aed601595a70AB815c96711a31Bc65", // USDC on Fuji
    USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // USDT on Fuji
    DAI: "0x5c49b268c9841AFF1Cc3B0a418ff5c3442eE3F3b", // DAI on Fuji
  },
};

// Rootstock Testnet Configuration
export const ROOTSTOCK_TESTNET_CONFIG: ChainConfig = {
  chainId: 31,
  name: "Rootstock Testnet",
  currency: "tRBTC",
  explorerUrl: "https://explorer.testnet.rootstock.io",
  rpcUrl:
    "https://rootstock-testnet.g.alchemy.com/v2/MShQiNPi5VzUekdRsalsGufPl0IkOFqR",
  nativeCurrency: {
    name: "Rootstock Bitcoin",
    symbol: "tRBTC",
    decimals: 18,
  },
  blockExplorerUrls: ["https://explorer.testnet.rootstock.io"],
  dexConfig: {
    name: "Uniswap V3",
    routerAddress: "0xE592427A0AEce92De3Edee1F18E0157C05861564", // Uniswap V3 Router on Rootstock Testnet
    factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984", // Uniswap V3 Factory on Rootstock Testnet
    quoterAddress: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6", // Uniswap V3 Quoter on Rootstock Testnet
  },
  tokens: {
    WRBTC: "0x09B6Ca5E4496238A1F176aEa6Bb607DB96c2286E", // Wrapped RBTC on Rootstock Testnet
    // Note: USDC, USDT, DAI tokens may not be available on Rootstock testnet
    // These are placeholder addresses - actual tokens need to be verified
    USDC: "0x0000000000000000000000000000000000000000", // Placeholder - no USDC on Rootstock testnet
    USDT: "0x0000000000000000000000000000000000000000", // Placeholder - no USDT on Rootstock testnet  
    DAI: "0x0000000000000000000000000000000000000000", // Placeholder - no DAI on Rootstock testnet
  },
};

// Chain registry for easy switching
export const CHAIN_REGISTRY: { [key: string]: ChainConfig } = {
  sepolia: SEPOLIA_CONFIG,
  mainnet: MAINNET_CONFIG,
  polygon: POLYGON_CONFIG,
  "avalanche-fuji": AVALANCHE_FUJI_CONFIG,
  "rootstock-testnet": ROOTSTOCK_TESTNET_CONFIG,
};

// Get chain configuration by name or chain ID
export function getChainConfig(chainNameOrId: string | number): ChainConfig {
  if (typeof chainNameOrId === "string") {
    const config = CHAIN_REGISTRY[chainNameOrId.toLowerCase()];
    if (!config) {
      throw new Error(
        `Unknown chain: ${chainNameOrId}. Available chains: ${Object.keys(
          CHAIN_REGISTRY
        ).join(", ")}`
      );
    }
    return config;
  } else {
    // Find by chain ID
    const config = Object.values(CHAIN_REGISTRY).find(
      (c) => c.chainId === chainNameOrId
    );
    if (!config) {
      throw new Error(`Unknown chain ID: ${chainNameOrId}`);
    }
    return config;
  }
}

// Default chain configuration (Sepolia for now)
export const DEFAULT_CHAIN_CONFIG = SEPOLIA_CONFIG;

// Get current chain configuration from environment or default
export function getCurrentChainConfig(): ChainConfig {
  const chainName = process.env.CHAIN_NAME || "sepolia";
  return getChainConfig(chainName);
}

// Export the current chain config as the main config
export const CHAIN_CONFIG = getCurrentChainConfig();
