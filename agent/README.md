# CalendeFi Agent

## Overview

An autonomous AI agent that converts any Google Calendar into an agentic wallet on EVM blockchains (Ethereum, Polygon, etc.). By inviting the service account email to a calendar, you can send transactions by creating calendar events with specific titles. The agent monitors the calendar, executes transactions at scheduled times, and handles RSVP-based approval voting for group transactions.

> **Note**: This is the backend agent service. For the complete CalendeFi experience including the web interface, see the main project README at the root of this repository.

---

## Features

### 📅 **Calendar-Based Wallet Operations**
- **Deterministic Wallets**: Each calendar gets its own unique wallet derived from the calendar ID
- **Event-Driven Transactions**: Send crypto by creating calendar events with specific titles
- **Scheduled Execution**: Transactions execute at the event's scheduled time
- **Real-time Monitoring**: Agent continuously monitors for new events and pending transactions

### 💸 **Transaction Types**
- **Send Transactions**: "Send 5 ETH to 0x..." - Transfer ETH or ERC-20 tokens
- **Token Swaps**: "Swap 10 USDC to ETH" - Token exchanges on Uniswap V3
  - Supported tokens: ETH, USDC, USDT, DAI, WETH
  - Optional slippage: "Swap 1 ETH to USDC 3%" or "Swap 1 ETH to USDC with 5% slippage"
  - Default slippage: 2%
- **WalletConnect**: Connect to dApps through all-day calendar events

### 🗳️ **RSVP-Based Approval System**
- **Group Voting**: Invite people to transaction events for approval
- **Majority Rule**: At least 50% of invitees must RSVP "Yes" for execution
- **No Attendees**: Events without attendees execute automatically
- **Real-time Status**: Event descriptions update with transaction status and results

### 🔗 **WalletConnect Integration**
- **All-Day Events**: Create "Connect to Dapp" events for dApp connections
- **URI Management**: Paste WalletConnect URLs in event descriptions
- **Auto-Updates**: Wallet address and balance automatically updated in events
- **Approval Flow**: Event creator gets RSVP prompts for connection approval

### 🔄 **Automated Monitoring**
- **Continuous Monitoring**: Checks for new events every 5 minutes
- **Status Updates**: Automatically updates event descriptions with transaction results
- **Error Handling**: Comprehensive error handling with detailed status messages
- **Balance Tracking**: Keeps wallet balance information current

---

## How It Works

### 1. **Setup**
1. Create a Google Cloud service account with Calendar API access
2. Invite the service account email to your Google Calendar
3. Configure environment variables with service account credentials
4. Start the agent - it will automatically generate a wallet for your calendar
5. **Onboard shared calendars** using the `/onboard/{calendarId}` endpoint

### 2. **Sending Transactions**
1. Create a new calendar event
2. Set the title to: `"Send 5 ETH to fabianferno.eth"`
3. Set the event time to when you want the transaction to execute
4. Optionally invite people for approval (they must RSVP "Yes")
5. Save the event - the agent will process it automatically

### 3. **WalletConnect Connections**
1. The agent automatically creates a "Connect to Dapp" all-day event
2. Copy a WalletConnect connection URL into the event description
3. Save the event - the agent will initiate the connection
4. RSVP to the event to approve or reject the connection

### 4. **Group Approvals**
1. Invite people to transaction events
2. They receive calendar invitations with RSVP options
3. At least 50% must respond "Yes" for the transaction to execute
4. Status updates show vote counts in real-time

---

## Event Formats

### Send Transactions
```
Title: "Send 5 ETH to 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
Time: [When you want it executed]
Attendees: [Optional - for approval voting]
```

### Token Swaps
```
Title: "Swap 10 USDC to ETH"
Time: [When you want it executed]
Attendees: [Optional - for approval voting]
```

### WalletConnect Connections
```
Title: "Connect to Dapp"
Description: "wc://connection-uri-here"
Type: All-day event
```

---

## API Endpoints

### REST API
- `GET /health` - Health check
- `GET /status` - Agent status and configuration
- `GET /calendars` - List all accessible calendars
- `GET /wallet/{calendarId}` - Get wallet information
- `POST /onboard/{calendarId}` - Accept and onboard a shared calendar
- `POST /switch-calendar/{calendarId}` - Switch to a different calendar
- `POST /process-events` - Manually trigger event processing
- `POST /api/agent` - Chat with the AI agent

### Agent Tools
- `getWalletInfo` - Retrieve wallet address and balance
- `processCalendarEvents` - Process pending calendar events
- `getAgentStatus` - Get current agent status

---

## Tech Stack

- **Backend**: Node.js, TypeScript, Express
- **Blockchain**: ethers.js for EVM interactions
- **DEX**: Uniswap V3 SDK for token swaps
- **Calendar Integration**: Google Calendar API v3
- **Scheduling**: node-cron for periodic event monitoring
- **AI/Agent SDK**: `@openserv-labs/sdk`
- **Validation**: `zod`
- **HTTP Requests**: `axios`

---

## Environment Variables

```bash
# Server Configuration
PORT=3000

# Google Calendar Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_CALENDAR_ID=primary

# EVM Configuration
CHAIN_NAME=sepolia
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
POLYGON_RPC_URL=https://polygon-rpc.com

# WalletConnect (for dApp connections)
WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Agent Configuration
OPENSERV_API_KEY=
OPENAI_API_KEY=
```

---

## Setup Instructions

### 1. Google Cloud Service Account Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Calendar API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create Service Account**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name it something like "calendar-wallet-agent"
   - Click "Create and Continue"
   - Skip role assignment for now
   - Click "Done"

4. **Generate Service Account Key**
   - Click on your service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file

5. **Extract Credentials**
   From the downloaded JSON file, you'll need:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`

6. **Share Calendar**
   - Go to [Google Calendar](https://calendar.google.com/)
   - Create a new calendar or use existing one
   - Go to calendar settings
   - Under "Share with specific people", add the service account email
   - Give it "Make changes to events" permission
   - Copy the calendar ID (found in calendar settings)

**Important**: The agent will automatically accept the shared calendar using the Google Calendar API's `CalendarList: insert` method, as required by recent Google API changes.

### 2. Install and Run

```bash
# Install dependencies
yarn install

# Copy environment file
cp env.example .env

# Edit .env with your credentials
# Add the Google service account credentials
# Set GOOGLE_CALENDAR_ID to your calendar ID

# Start the agent
yarn dev
```

### 3. Onboard Shared Calendars

After inviting the service account to your calendar, you need to onboard it:

```bash
# Get the calendar ID from your Google Calendar settings
# It looks like: your-email@gmail.com or calendar-id@group.calendar.google.com

# Onboard the shared calendar
curl -X POST http://localhost:3000/onboard/your-calendar-id@group.calendar.google.com

# List all accessible calendars
curl http://localhost:3000/calendars

# Switch to a different calendar
curl -X POST http://localhost:3000/switch-calendar/your-calendar-id@group.calendar.google.com
```

### 4. Verify Setup

1. Check the console output for wallet initialization
2. Visit `http://localhost:3000/health` to verify the server is running
3. Visit `http://localhost:3000/status` to see agent status
4. Visit `http://localhost:3000/calendars` to see accessible calendars
5. Check your calendar for the automatically created "Connect to Dapp" event

---

## Usage Examples

### Basic Send Transaction
1. Create event with title: `"Send 1 ETH to 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"`
2. Set time to current time or future
3. Save event
4. Agent processes and updates event with transaction result

### Group Transaction with Voting
1. Create event with title: `"Send 10 ETH to 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"`
2. Invite 4 people to the event
3. At least 2 must RSVP "Yes" for execution
4. Agent monitors RSVPs and executes when threshold is met

### WalletConnect Connection
1. Agent automatically creates "Connect to Dapp" event
2. Copy WalletConnect URI to event description
3. Save event
4. Agent initiates connection and waits for your RSVP approval

---

## Security Features

- **Deterministic Wallets**: Unique wallet per calendar generated from calendar ID
- **Testnet Default**: Default operations on Sepolia testnet for safety
- **No Private Key Storage**: Private keys generated on-demand and not stored
- **Transaction Validation**: Balance checks and validation before transactions
- **Approval Required**: Group transactions require majority approval
- **Secure Hashing**: Uses SHA-256 for wallet generation

---

## Future Enhancements

### Planned Features
- **Advanced DeFi**: Liquidity provision, staking through calendar events
- **Multi-Chain**: Support for additional EVM chains (Polygon, Arbitrum, etc.)
- **Smart Contracts**: Deploy and interact with smart contracts via events
- **Portfolio Tracking**: Balance tracking across multiple tokens
- **Transaction History**: Detailed transaction logs and analytics
- **Gas Optimization**: Dynamic gas price optimization

### Integration Possibilities
- **Slack Integration**: Create transactions via Slack calendar
- **Discord Bot**: Calendar-based wallet for Discord communities
- **Web Dashboard**: Visual interface for calendar management
- **Mobile App**: Native mobile app for calendar wallet management

---

## Troubleshooting

### Common Issues

1. **Service Account Not Working**
   - Verify the service account email is invited to the calendar
   - Check that Calendar API is enabled in Google Cloud Console
   - Ensure private key is properly formatted with `\n` for newlines

2. **Transactions Not Executing**
   - Check wallet balance (visit `/wallet/{calendarId}` endpoint)
   - Verify event title format matches expected patterns
   - Check event time is in the past or current time
   - For group transactions, ensure enough people RSVP'd "Yes"
   - Ensure sufficient ETH for gas fees

3. **Calendar Not Found**
   - Verify `GOOGLE_CALENDAR_ID` is correct
   - Check calendar ID in Google Calendar settings
   - Ensure service account has access to the calendar
   - Use the `/onboard/{calendarId}` endpoint to accept shared calendars

4. **Shared Calendar Issues**
   - Ensure the service account email has been invited to the calendar
   - The agent automatically accepts shared calendars using the CalendarList API
   - If you see "Calendar not found" errors, check that the calendar ID matches exactly
   - For shared calendars, use the full email address as the calendar ID (e.g., `your-email@gmail.com`)

### Debug Endpoints
- `GET /status` - Check agent status and configuration
- `GET /wallet/{calendarId}` - Verify wallet information
- `POST /process-events` - Manually trigger event processing

---

## Contributing

This is an experimental project demonstrating the concept of calendar-based agentic wallets. Contributions and suggestions are welcome!

### Development Setup
```bash
yarn install
yarn dev
```

### Testing
```bash
yarn test
```

---

## License

MIT License - feel free to use this for your own calendar-based crypto experiments!
