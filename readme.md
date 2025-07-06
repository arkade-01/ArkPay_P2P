# P2P Crypto Trading Telegram Bot

A comprehensive Telegram bot for peer-to-peer cryptocurrency trading, enabling users to buy and sell USDT and USDC across multiple blockchain networks with seamless fiat integration.

## 🚀 Features

### Trading Capabilities
- **Multi-Token Support**: Trade USDT and USDC
- **Multi-Chain Support**: 
  - Binance Smart Chain (BSC) - USDT only
  - Polygon - USDT, USDC
  - Arbitrum One - Not supported
  - Base - USDC only
- **Real-time Exchange Rates**: Dynamic pricing with live rate fetching
- **Secure Transactions**: Built-in refund address system for failed transactions

### User Management
- **Account Verification**: Bank account linking and verification
- **Trade History**: Track volume and transaction count
- **Session Management**: Secure state management for ongoing trades
- **User Profiles**: Store and manage user trading preferences

### Security Features
- **Input Validation**: Comprehensive validation for addresses and amounts
- **Error Handling**: Robust error management and user feedback
- **Session Timeout**: Automatic cleanup of expired trading sessions

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Telegram Bot Token
- PayCrest API credentials

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd p2p_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   BOT_TOKEN=your_telegram_bot_token
   MONGODB_URI=mongodb://localhost:27017/p2p_bot
   API_KEY=your_paycrest_api_key
   API_BASE_URL=https://api.paycrest.io/v1
   ```

4. **Start the application**
   ```bash
   npm start
   ```



## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_TOKEN` | Telegram Bot API token | ✅ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `API_KEY` | PayCrest API key | ✅ |
| `API_BASE_URL` | PayCrest API base URL | ✅ |

### Supported Networks

| Token | Networks |
|-------|----------|
| USDT | BSC, Polygon |
| USDC | Polygon, Base |

## 🎯 Usage

### Starting a Trade

1. **Initiate Bot**: Start a conversation with your bot on Telegram
2. **Account Setup**: Link your bank account for fiat transactions
3. **Choose Action**: Select Buy or Sell from the main menu
4. **Select Token**: Choose between USDT or USDC
5. **Choose Network**: Select the blockchain network
6. **Enter Details**: Provide amount and wallet addresses
7. **Confirm Trade**: Review and confirm transaction details

### Command Reference

- `/start` - Initialize the bot and show main menu
- `/sell` - Start a sell transaction
- `/buy` - Start a buy transaction (if implemented)
- `/help` - Show help information

## 🔄 API Integration

### PayCrest API

The bot integrates with PayCrest API for:
- Real-time exchange rate fetching
- Order creation and management
- Payment processing
- Transaction status tracking


## 🚨 Error Handling

The bot includes comprehensive error handling for:

- **Network Issues**: API timeouts and connection errors
- **Validation Errors**: Invalid addresses, amounts, or user data
- **Database Errors**: MongoDB connection and query failures
- **Session Management**: Handling expired or corrupted sessions

## 🔒 Security Considerations

- **No Private Key Storage**: Bot never handles or stores private keys
- **Input Sanitization**: All user inputs are validated and sanitized
- **Session Security**: Temporary session data with automatic cleanup
- **API Security**: Secure API key management and request signing



## 📊 Monitoring and Logging

The bot includes comprehensive logging for:
- User interactions and commands
- API requests and responses
- Error tracking and debugging
- Trade execution and completion


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Guidelines

- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Document all new features and APIs
- Ensure backward compatibility

## 🐛 Troubleshooting

### Common Issues

**Bot not responding**
- Check BOT_TOKEN is correct
- Verify bot is added to Telegram
- Check network connectivity

**Database connection errors**
- Verify MONGODB_URI is correct
- Ensure MongoDB is running
- Check database permissions

**API errors**
- Verify API_KEY is valid
- Check API rate limits
- Ensure API endpoints are accessible

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review error logs for debugging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔄 Changelog

### v1.0.0
- Initial release
- Basic buy/sell functionality
- Multi-chain support
- User verification system
- PayCrest API integration

---

**Made with ❤️ for the crypto community**