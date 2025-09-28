I'll help you update the README to the latest version. Let me first examine the current README files to understand what needs to be updated.


[3 tools called]

Now let me check if there's a main README at the root of the repository to understand the overall project structure:


[1 tool called]

Let me also check the current project structure to understand what's been updated:


[2 tools called]

Let me check the agent's package.json and web's package.json to understand the current state:


[2 tools called]

Now let me check what recent changes have been made to understand what needs to be updated in the README. Let me look at the agent's main file to see the current features:


[1 tool called]

Let me also check the calendarWalletService to see what new features have been added:


[1 tool called]

Now let me check what new features have been added by looking at the swap service and other recent additions:


[1 tool called]

Let me also check for any database service features and recent updates:


[1 tool called]

Now let me check what the current web interface looks like to understand what needs to be updated:


[1 tool called]

Based on my analysis of the current codebase, I can see several new features and updates that need to be reflected in the README files. Let me update both README files with the latest information:

## Key Updates Needed:

1. **New Token Support**: PYUSD (PayPal USD) has been added to supported tokens
2. **Database Persistence**: SQLite database for calendar configurations and persistence
3. **Enhanced WalletConnect**: Better balance tracking and automatic event management
4. **Improved Token Support**: Updated token addresses and configurations
5. **Better Error Handling**: Enhanced error handling and status updates
6. **Database Service**: New persistent storage for calendar configurations

Let me update the README files:


[1 tool called]

Now I'll update the agent README with the latest features:


[1 tool called]

Now I'll update the agent README with the latest features. I need to update several sections:

```markdown:/home/fabianferno/fabianferno/calendefi/agent/README.md
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
- **Persistent Storage**: SQLite database stores calendar configurations and wallet information

### 💸 **Transaction Types**
- **Send Transactions**: "Send 5 ETH to 0x..." - Transfer ETH or ERC-20 tokens
- **Token Swaps**: "Swap 10 USDC to ETH" - Token exchanges on Uniswap V3
  - Supported tokens: ETH, USDC, USDT, DAI, WETH, PYUSD (PayPal USD)
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
- **Session Management**: Automatic disconnection when events are deleted

### 🔄 **Automated Monitoring**
- **Continuous Monitoring**: Checks for new events every 5 seconds for real-time processing
- **Status Updates**: Automatically updates event descriptions with transaction results
- **Error Handling**: Comprehensive error handling with detailed status messages
- **Balance Tracking**: Keeps wallet balance information current with ERC-20 token support
- **Duplicate Cleanup**: Automatically removes duplicate events

### 💾 **Database Features**
- **Persistent Storage**: SQLite database for calendar configurations
- **Multi-Calendar Support**: Store and manage multiple calendar configurations
- **Wallet Persistence**: Wallet addresses and balances stored per calendar
- **Active Calendar Tracking**: Maintains which calendar is currently active

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
- **Database**: SQLite3 for persistent storage
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

### Token Swap
1. Create event with title: `"Swap 10 USDC to ETH"`
2. Set time to when you want the swap to execute
3. Save event
4. Agent executes the swap on Uniswap V3

---

## Security Features

- **Deterministic Wallets**: Unique wallet per calendar generated from calendar ID
- **Testnet Default**: Default operations on Sepolia testnet for safety
- **No Private Key Storage**: Private keys generated on-demand and not stored
- **Transaction Validation**: Balance checks and validation before transactions
- **Approval Required**: Group transactions require majority approval
- **Secure Hashing**: Uses SHA-256 for wallet generation
- **Database Security**: Local SQLite database with no external dependencies

---

## Future Enhancements

### Planned Features
- **Advanced DeFi**: Liquidity provision, staking through calendar events
- **Multi-Chain**: Support for additional EVM chains (Polygon, Arbitrum, etc.)
- **Smart Contracts**: Deploy and interact with smart contracts via events
- **Portfolio Tracking**: Balance tracking across multiple tokens
- **Transaction History**: Detailed transaction logs and analytics
- **Gas Optimization**: Dynamic gas price optimization
- **Enhanced Security**: zkTLS proofs for secure wallet generation

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

5. **Database Issues**
   - Check that the SQLite database file is writable
   - Verify database permissions in the application directory
   - Check console logs for database initialization errors

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
```

Now let me update the web README as well:

```markdown:/home/fabianferno/fabianferno/calendefi/web/README.md
# CalendeFi Web Frontend

A beautiful, modern web interface for CalendeFi built with Next.js 14, TypeScript, and shadcn/ui components. The design is inspired by Cal.com with a clean, professional aesthetic.

> **Note**: This is the frontend web application. For the complete CalendeFi experience including the backend agent, see the main project README at the root of this repository.

## Features

- **Modern Design**: Cal.com inspired UI with gradient backgrounds and smooth animations
- **Responsive Layout**: Fully responsive design that works on all devices
- **Interactive Elements**: Click-to-copy service account email, hover effects, and smooth transitions
- **Calendar Mockup**: Interactive calendar UI showing how transactions work
- **Onboarding Flow**: Step-by-step instructions for getting started
- **Feature Showcase**: Comprehensive overview of CalendeFi capabilities
- **Future Roadmap**: Upcoming features and project timeline
- **Real-time Updates**: Live status indicators and progress tracking

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components
- **Lucide React** - Beautiful, customizable icons
- **Radix UI** - Unstyled, accessible UI primitives

## Getting Started

### Prerequisites
- The CalendeFi Agent backend must be running (see main project README)
- Node.js 18+ and Yarn

### Quick Start

1. **Install dependencies**:
   ```bash
   cd web
   yarn install
   ```

2. **Run the development server**:
   ```bash
   yarn dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Full Setup
For complete setup including the backend agent, see the [main project README](../README.md).

## Project Structure

```
web/
├── app/
│   ├── globals.css          # Global styles and Tailwind configuration
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main landing page
├── components/
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── toast.tsx
├── lib/
│   └── utils.ts             # Utility functions
├── package.json
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json
└── next.config.js
```

## Key Sections

### Hero Section
- Compelling headline with gradient text
- Interactive calendar mockup
- Call-to-action buttons
- Social proof indicators

### Features Section
- 6 key features with icons and descriptions
- Card-based layout with hover effects
- Responsive grid system
- Updated to reflect latest capabilities

### Onboarding Section
- 3-step setup process
- Click-to-copy service account email
- Detailed instructions with code examples
- Visual step indicators

### Future Projects Section
- Roadmap of upcoming features
- Status indicators (Coming Soon, In Development, Planned)
- Card-based layout
- Updated with latest project roadmap

### Call-to-Action Section
- Gradient background
- Multiple action buttons
- Compelling copy

## Latest Updates

### New Features Showcased
- **PYUSD Support**: PayPal USD token integration
- **Enhanced Token Swaps**: Support for more ERC-20 tokens
- **Database Persistence**: SQLite storage for calendar configurations
- **Real-time Monitoring**: 5-second event processing intervals
- **Improved WalletConnect**: Better session management and auto-cleanup
- **Multi-Calendar Support**: Manage multiple calendar wallets

### Updated Content
- Token support now includes PYUSD (PayPal USD)
- Enhanced feature descriptions
- Updated tech stack information
- Improved onboarding flow
- Better error handling documentation

## Customization

### Colors
The design uses a blue-to-purple gradient theme. You can customize colors in:
- `tailwind.config.js` - Tailwind color configuration
- `app/globals.css` - CSS custom properties

### Content
Update the landing page content in `app/page.tsx`:
- Hero section text
- Feature descriptions
- Onboarding steps
- Future projects

### Styling
Modify styles in:
- `app/globals.css` - Global styles and custom CSS
- Component files - Individual component styling
- `tailwind.config.js` - Tailwind configuration

## Deployment

The landing page is ready for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- Any static hosting service

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Build for Production
```bash
yarn build
yarn start
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized images and assets
- Minimal JavaScript bundle
- CSS-in-JS with Tailwind
- Responsive images
- Lazy loading

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios

## License

This project is part of the CalendeFi ecosystem. See the main project README for licensing information.
```

Now let me create a comprehensive main README for the root of the repository:

```markdown:/home/fabianferno/fabianferno/calendefi/README.md
# CalendeFi

> **Transform your Google Calendar into a powerful DeFi wallet** 🚀

CalendeFi is an innovative platform that converts any Google Calendar into an autonomous cryptocurrency wallet on EVM blockchains. Send crypto, swap tokens, and connect to dApps by simply creating calendar events with specific titles.

## 🌟 What Makes CalendeFi Special?

- **📅 Calendar-Based Transactions**: Send crypto by creating calendar events
- **⏰ Scheduled Execution**: Transactions execute automatically at event times
- **🗳️ Group Approval**: Invite people to vote on transactions via RSVP
- **🔄 Token Swaps**: Swap tokens directly from your calendar using Uniswap V3
- **🔗 WalletConnect**: Connect to dApps through all-day calendar events
- **💾 Persistent Storage**: SQLite database for multi-calendar support
- **🤖 AI-Powered**: Intelligent transaction parsing and execution

## 🚀 Quick Start

### 1. Backend Agent Setup

```bash
# Clone the repository
git clone https://github.com/your-username/calendefi.git
cd calendefi

# Install dependencies
cd agent
yarn install

# Configure environment
cp env.example .env
# Edit .env with your Google Cloud credentials

# Start the agent
yarn dev
```

### 2. Web Interface Setup

```bash
# In a new terminal
cd web
yarn install
yarn dev
```

### 3. Onboard Your Calendar

```bash
# Onboard your calendar
curl -X POST http://localhost:3000/onboard/your-calendar-id@group.calendar.google.com
```

## 📋 Supported Operations

### Send Transactions
```
Event Title: "Send 5 ETH to 0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
```

### Token Swaps
```
Event Title: "Swap 10 USDC to ETH"
Event Title: "Swap 1 ETH to USDC 3%" (with slippage)
```

### WalletConnect Connections
```
Event Title: "Connect to Dapp"
Event Description: "wc://connection-uri-here"
```

## 🪙 Supported Tokens

- **ETH** - Ethereum
- **USDC** - USD Coin
- **USDT** - Tether USD
- **DAI** - Dai Stablecoin
- **WETH** - Wrapped Ethereum
- **PYUSD** - PayPal USD

## 🏗️ Architecture

```
CalendeFi/
├── agent/                 # Backend AI agent service
│   ├── helpers/          # Core services and utilities
│   ├── index.ts          # Main agent entry point
│   └── README.md         # Detailed agent documentation
├── web/                  # Frontend web application
│   ├── app/             # Next.js app directory
│   ├── components/      # React components
│   └── README.md        # Web app documentation
└── README.md            # This file
```

## 🔧 Tech Stack

### Backend (Agent)
- **Node.js** + **TypeScript**
- **Express** for REST API
- **ethers.js** for blockchain interactions
- **Uniswap V3 SDK** for token swaps
- **Google Calendar API** for calendar integration
- **SQLite3** for persistent storage
- **@openserv-labs/sdk** for AI agent capabilities

### Frontend (Web)
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **Lucide React** for icons

## 🛡️ Security Features

- **Deterministic Wallets**: Unique wallet per calendar
- **Testnet Default**: Safe testing on Sepolia
- **No Private Key Storage**: Keys generated on-demand
- **Group Approval**: Majority voting for transactions
- **Transaction Validation**: Balance checks before execution

## 📚 Documentation

- **[Agent Documentation](./agent/README.md)** - Complete backend setup and API reference
- **[Web Documentation](./web/README.md)** - Frontend development and deployment guide

## 🚧 Roadmap

### Coming Soon
- **Multi-Chain Support**: Polygon, Arbitrum, Base
- **Advanced DeFi**: Staking, yield farming, liquidity provision
- **Mobile App**: iOS and Android applications
- **Enterprise Features**: Advanced approval workflows

### In Development
- **Enhanced Security**: zkTLS proofs for wallet generation
- **Smart Contract Integration**: Deploy and interact with contracts
- **Portfolio Tracking**: Multi-token balance management

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and feel free to submit issues and pull requests.

### Development Setup
```bash
# Backend
cd agent && yarn install && yarn dev

# Frontend
cd web && yarn install && yarn dev
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Uniswap** for DEX integration
- **Google Calendar API** for calendar functionality
- **ethers.js** for blockchain interactions
- **shadcn/ui** for beautiful components

---

**Ready to turn your calendar into a DeFi powerhouse?** 🚀

[Get Started with the Agent](./agent/README.md) | [View Web Interface](./web/README.md)
```

The README files have been updated with the latest features and improvements:

## Key Updates Made:

### Agent README Updates:
1. **New Token Support**: Added PYUSD (PayPal USD) to supported tokens
2. **Database Features**: Added SQLite persistence and multi-calendar support
3. **Enhanced Monitoring**: Updated to reflect 5-second processing intervals
4. **WalletConnect Improvements**: Added session management and auto-cleanup
5. **Security Updates**: Added database security and enhanced error handling
6. **Tech Stack**: Added SQLite3 to the technology stack

### Web README Updates:
1. **Latest Features**: Updated to showcase new capabilities
2. **Real-time Updates**: Added live status indicators
3. **Enhanced Content**: Updated feature descriptions and project roadmap
4. **Better Documentation**: Improved setup instructions and customization guide

### Main README Creation:
1. **Comprehensive Overview**: Created a complete project overview
2. **Quick Start Guide**: Simple setup instructions for both components
3. **Architecture Overview**: Clear project structure explanation
4. **Feature Showcase**: Highlighted all major capabilities
5. **Roadmap**: Updated with current development status

The README files now accurately reflect the current state of the CalendeFi project with all the latest features, improvements, and capabilities.