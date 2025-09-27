// Algorand Testnet configuration
export const ALGORAND_CONFIG = {
  chainId: "algorand-testnet",
  name: "Algorand Testnet",
  currency: "ALGO",
  explorerUrl: "https://testnet.explorer.perawallet.app",
  rpcUrl: process.env.ALGORAND_RPC_URL || "https://testnet-api.algonode.cloud",
  indexerUrl:
    process.env.ALGORAND_INDEXER_URL || "https://testnet-idx.algonode.cloud",
  port: process.env.ALGORAND_PORT || 443,
  token: process.env.ALGORAND_TOKEN || "",
};

export const BOT_USERNAME = "@algorand_bot";
