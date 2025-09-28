export const PYUSD_token_contract =
  "0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9";

// Token configurations for ERC20 support
export const SUPPORTED_TOKENS = {
  PYUSD: {
    address: "0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9",
    symbol: "PYUSD",
    name: "PayPal USD",
    decimals: 6,
  },
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  USDT: {
    address: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", // Sepolia USDT
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
} as const;
