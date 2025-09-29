# CalenDeFi Swap Testing Guide

This guide provides comprehensive instructions for testing the swap functionality in your CalenDeFi project.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Safe Testing (No Real Transactions)](#safe-testing-no-real-transactions)
- [Calendar Event Testing (Real Execution)](#calendar-event-testing-real-execution)
- [Step-by-Step Testing Process](#step-by-step-testing-process)
- [What to Look For](#what-to-look-for)
- [Supported Tokens](#supported-tokens)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Prerequisites

- CalenDeFi agent server running on `http://localhost:3000`
- Valid calendar ID (if testing with calendar events)
- Testnet ETH for gas fees
- Some test tokens to swap

## Safe Testing (No Real Transactions)

Start with these endpoints that don't execute actual swaps but verify the system is working correctly.

### Test Asset Access

```bash
# Test if ETH is accessible
curl http://localhost:3000/test-eth

# Test if specific token pairs are accessible
curl http://localhost:3000/test-swap-safe/ETH/USDC
curl http://localhost:3000/test-swap-safe/USDC/ETH
curl http://localhost:3000/test-swap-safe/ETH/DAI
```

### Check Available Assets

```bash
# Discover what assets are available on the testnet
curl http://localhost:3000/discover-assets
```

### Check Pool Availability

```bash
# Check if liquidity pools exist for trading pairs
curl http://localhost:3000/check-pools/ETH/USDC
curl http://localhost:3000/check-pools/USDC/ETH
curl http://localhost:3000/check-pools/ETH/DAI
```

### Demo Swap (Shows What Would Happen)

```bash
# See if a swap would be possible without executing it
curl http://localhost:3000/demo-swap/ETH/USDC
curl http://localhost:3000/demo-swap/USDC/ETH
```

## Calendar Event Testing (Real Execution)

### Create Test Swap Events

```bash
# Create a test swap event that will be processed by the calendar agent
curl -X POST http://localhost:3000/test-swap/YOUR_CALENDAR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "ETH",
    "toToken": "USDC", 
    "amount": "0.01"
  }'

# Test different token pairs
curl -X POST http://localhost:3000/test-swap/YOUR_CALENDAR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "USDC",
    "toToken": "ETH", 
    "amount": "10"
  }'
```

### Manual Event Processing

```bash
# Manually trigger event processing
curl -X POST http://localhost:3000/process-events/YOUR_CALENDAR_ID
```

## Step-by-Step Testing Process

### 1. Start the Server

```bash
cd /home/fabianferno/fabianferno/calendefi/agent
yarn start
```

### 2. Check Server Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Calendar Wallet Agent",
  "version": "1.0.0"
}
```

### 3. Get Your Calendar ID

```bash
# Check saved calendars
curl http://localhost:3000/saved-calendars

# Or get all accessible calendars
curl http://localhost:3000/calendars
```

### 4. Test Asset Accessibility

```bash
# Test ETH access
curl http://localhost:3000/test-eth

# Discover available assets
curl http://localhost:3000/discover-assets
```

### 5. Test Specific Token Pairs

```bash
# Test token accessibility
curl http://localhost:3000/test-swap-safe/ETH/USDC

# Check pool availability
curl http://localhost:3000/check-pools/ETH/USDC
```

### 6. Create a Test Swap Event

Replace `YOUR_CALENDAR_ID` with your actual calendar ID:

```bash
curl -X POST http://localhost:3000/test-swap/YOUR_CALENDAR_ID \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "ETH",
    "toToken": "USDC",
    "amount": "0.01"
  }'
```

### 7. Monitor Execution

```bash
# Process events manually
curl -X POST http://localhost:3000/process-events/YOUR_CALENDAR_ID

# Check agent status
curl http://localhost:3000/status
```

## What to Look For

### ✅ Successful Tests Should Show:

- **Asset addresses are valid**: Tokens have correct contract addresses
- **Pools exist**: Liquidity pools are available for the trading pair
- **Swap parameters are correct**: Amount, slippage, and other parameters are properly formatted
- **Transaction hash returned**: For real swaps, you get a transaction hash
- **Event descriptions updated**: Calendar events show transaction results

### ❌ Common Issues to Watch For:

- **"No pools available"**: The trading pair isn't supported on testnet
- **"Invalid token"**: Token symbol not recognized
- **"Insufficient balance"**: Not enough tokens for the swap
- **Network connection issues**: RPC endpoint problems
- **"Calendar agent not initialized"**: Agent not running

## Supported Tokens

The following tokens are supported for swaps:

- **ETH** (native token)
- **USDC** (USD Coin)
- **USDT** (Tether)
- **DAI** (Dai Stablecoin)
- **WETH** (Wrapped ETH)
- **PYUSD** (PayPal USD)

## Troubleshooting

### Server Not Starting

```bash
# Check if port 3000 is available
lsof -i :3000

# Kill process if needed
kill -9 $(lsof -t -i:3000)
```

### Calendar Agent Not Running

```bash
# Check agent status
curl http://localhost:3000/status

# Restart with a calendar
curl -X POST http://localhost:3000/onboard/YOUR_CALENDAR_ID
```

### Swap Failing

1. **Check token balances**:
   ```bash
   curl http://localhost:3000/wallet/YOUR_CALENDAR_ID
   ```

2. **Verify pools exist**:
   ```bash
   curl http://localhost:3000/check-pools/ETH/USDC
   ```

3. **Test with smaller amounts**:
   ```bash
   curl -X POST http://localhost:3000/test-swap/YOUR_CALENDAR_ID \
     -H "Content-Type: application/json" \
     -d '{"fromToken": "ETH", "toToken": "USDC", "amount": "0.001"}'
   ```

### Clear All Events (Nuclear Option)

```bash
# Clear all events and start fresh
curl -X POST http://localhost:3000/fresh-start/YOUR_CALENDAR_ID
```

## API Reference

### Testing Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/test-eth` | GET | Test ETH asset accessibility |
| `/discover-assets` | GET | Get all available assets |
| `/test-swap-safe/:fromToken/:toToken` | GET | Test token pair accessibility |
| `/check-pools/:fromToken/:toToken` | GET | Check if pools exist |
| `/demo-swap/:fromToken/:toToken` | GET | Demo swap without execution |
| `/test-swap/:calendarId` | POST | Create test swap event |

### Event Processing Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/process-events/:calendarId` | POST | Manually process events |
| `/status` | GET | Get agent status |
| `/wallet/:calendarId` | GET | Get wallet information |

### Utility Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/calendars` | GET | Get accessible calendars |
| `/saved-calendars` | GET | Get saved calendars |
| `/fresh-start/:calendarId` | POST | Clear all events and restart |

## Example Test Script

Here's a complete test script you can run:

```bash
#!/bin/bash

# Set your calendar ID
CALENDAR_ID="your-calendar-id@group.calendar.google.com"

echo "🚀 Starting CalenDeFi Swap Tests..."

# 1. Check server health
echo "1. Checking server health..."
curl -s http://localhost:3000/health | jq

# 2. Test ETH access
echo "2. Testing ETH access..."
curl -s http://localhost:3000/test-eth | jq

# 3. Discover assets
echo "3. Discovering available assets..."
curl -s http://localhost:3000/discover-assets | jq

# 4. Test token pair
echo "4. Testing ETH/USDC pair..."
curl -s http://localhost:3000/test-swap-safe/ETH/USDC | jq

# 5. Check pools
echo "5. Checking pools for ETH/USDC..."
curl -s http://localhost:3000/check-pools/ETH/USDC | jq

# 6. Demo swap
echo "6. Demo swap ETH/USDC..."
curl -s http://localhost:3000/demo-swap/ETH/USDC | jq

# 7. Create test swap event
echo "7. Creating test swap event..."
curl -s -X POST http://localhost:3000/test-swap/$CALENDAR_ID \
  -H "Content-Type: application/json" \
  -d '{"fromToken": "ETH", "toToken": "USDC", "amount": "0.01"}' | jq

# 8. Process events
echo "8. Processing events..."
curl -s -X POST http://localhost:3000/process-events/$CALENDAR_ID | jq

echo "✅ Test sequence completed!"
```

## Monitoring Swap Execution

Watch the server logs for detailed swap execution information:

```
[SWAP] Starting swap: 0.01 ETH -> USDC
[SWAP] From token: ETH, To token: USDC
[SWAP] Amount in wei: 10000000000000000
[SWAP] Expected output: 25.123 USDC
[SWAP] Minimum output (2% slippage): 24.620 USDC
[SWAP] Executing swap with parameters: {...}
[SWAP] Transaction submitted: 0x1234...
[SWAP] Swap successful! Hash: 0x1234...
```

## Security Notes

- **Testnet Only**: The system runs on Rootstock Testnet by default
- **No Real Money**: All transactions use testnet tokens
- **Private Keys**: Generated on-demand and not stored
- **Gas Fees**: Use testnet ETH for transaction fees

---

**Need Help?** Check the server logs for detailed error messages and transaction status updates.
