# Bluefin Auto Trader

This module enables automated trading on the Bluefin perpetual futures exchange on the Sui blockchain. It provides functionality for monitoring markets, analyzing trading opportunities, and executing trades based on configurable strategies.

## Features

- **Automated Trading**: Monitors markets and executes trades based on market conditions
- **Dual Trading Modes**: Supports both perpetual futures and spot trading
- **Risk Management**: Implements stop-loss, take-profit, and position sizing based on risk parameters
- **Configurable Settings**: Customize leverage, risk per trade, preferred markets, and more
- **Market Analysis**: Implements simple momentum strategy with customizable entry conditions
- **Position Management**: Automatically manages open positions including trailing stops
- **Automatic Withdrawals**: Can automatically withdraw profits to your SUI wallet
- **Chat Integration**: Full integration with WhatsApp chat commands

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Sui wallet with private key (ED25519 format)
- USDC funds deposited to Bluefin exchange

### Setup

1. Clone the repository and install dependencies:
   ```
   npm install
   ```

2. Copy the sample environment file:
   ```
   cp bluefin.env.sample .env
   ```

3. Edit `.env` with your specific configuration:
   - Set `PRIVATE_KEY` to your Sui wallet private key
   - Adjust trading parameters as needed

### Running the Auto Trader

Start the auto trader with:

```
npm run bluefin-trade
```

Or via the CLI:

```
ts-node bluefin-auto-trade.ts
```

### WhatsApp Bot Integration

The auto trader is integrated with the WhatsApp bot and can be controlled using chat commands:

- `bluefin help` - Show available commands
- `bluefin setup` - Set up your Bluefin trading account
- `bluefin auto start` - Start perpetual futures auto trading
- `bluefin auto spot` - Start spot trading with automatic withdrawals to wallet
- `bluefin spot` - Shortcut for starting spot trading
- `bluefin auto stop` - Stop automated trading
- `bluefin auto status` - Check the status of the auto trader
- `bluefin markets` - Show available markets
- `bluefin account` - Show account information
- `bluefin start <amount>` - One-click setup to start trading with the specified amount

## How It Works

### Trading Strategies

#### Perpetual Futures Strategy
The default strategy for perpetuals is a momentum-based approach:
1. Monitors price changes over 24 hours across preferred markets
2. Enters LONG positions when price momentum is positive above a threshold
3. Enters SHORT positions when price momentum is negative below a threshold
4. Implements risk management with automatic stop losses and take profits
5. Uses trailing stops to lock in profits

#### Spot Trading Strategy
The spot trading strategy uses a counter-momentum approach:
1. Monitors spot markets (BTC-USDC, ETH-USDC, SUI-USDC)
2. BUYs when price is dropping (buy low)
3. SELLs when price is rising and you own the asset (sell high)
4. Automatically withdraws profits to your SUI wallet when they exceed the threshold

### Automatic Withdrawal System
When enabled (default for spot trading):
1. Tracks profits from trading activities
2. When profits exceed the withdrawal threshold (default: 25 USDC for spot)
3. Automatically initiates a withdrawal to your SUI wallet
4. Updates the profit tracking to reflect the withdrawal

### Class Structure

- `BluefinAutoTrader` - Main class handling trading decisions and execution
- `BluefinManager` - Manages integration with WhatsApp commands
- `BluefinWrapper` - Wrapper around the official Bluefin client
- `SuiSwapManager` - Handles swapping SUI to USDC for trading

## Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `NETWORK` | Network to use (testnet/mainnet) | testnet |
| `PREFERRED_MARKETS` | Perp markets to trade | BTC-PERP,ETH-PERP,SUI-PERP |
| `PREFERRED_SPOT_MARKETS` | Spot markets to trade | BTC-USDC,ETH-USDC,SUI-USDC |
| `MAX_LEVERAGE` | Maximum leverage to use | 3 |
| `RISK_PER_TRADE` | Percentage of balance to risk per trade | 0.05 (5%) |
| `STOP_LOSS_PERCENT` | Stop loss percentage from entry | 0.05 (5%) |
| `TRADING_INTERVAL_MINUTES` | How often to check for trading opportunities | 5 minutes |
| `MAX_POSITIONS` | Maximum number of open positions | 3 |
| `AUTO_WITHDRAW` | Enable automatic withdrawals | true for spot |
| `PROFIT_THRESHOLD` | Minimum profit before withdrawal | 25 USDC for spot |

## Warning

**Trading cryptocurrencies involves significant risk and can result in substantial financial losses. This auto trader is provided for educational purposes only. Always test in testnet first and start with small amounts when moving to mainnet.**

## Customizing

- For perpetual futures strategy, edit the `findTradingOpportunities` method
- For spot trading strategy, edit the `findSpotOpportunities` method
- Withdrawal settings can be adjusted in the `handleSpotTraderStart` method 