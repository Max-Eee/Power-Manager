# PowerSwitch - Power Management System

A modern, production-ready power monitoring and management system built with Next.js, Supabase, and Telegram Bot integration. Track power consumption, monitor outages, and receive real-time notifications.

## ✨ Features

- 📊 **Real-time Dashboard** - Live power status and consumption tracking
- ⚡ **Power Status Monitoring** - Track power ON/OFF states with duration
- 📈 **Consumption Analytics** - Visual charts and detailed consumption data
- 🔔 **Smart Notifications** - Real-time alerts via Telegram bot
- 📝 **System Logs** - Comprehensive activity tracking
- 📱 **Responsive Design** - Modern UI built with Shadcn/UI components
- 🔒 **Production Ready** - Secure database with Row Level Security

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Notifications**: Telegram Bot API
- **Charts**: Recharts
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Telegram Bot Token (optional but recommended)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd powerswitch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure your environment variables in `.env.local`:**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

   # Telegram Bot Configuration
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_CHAT_ID=your_telegram_chat_id_here

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here

   # Database Configuration
   DATABASE_URL=your_supabase_database_url_here
   ```

## 🗄️ Database Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the migration script**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Execute the query

3. **The migration will create:**
   - `profiles` - User profiles and preferences
   - `power_status` - Power ON/OFF tracking
   - `power_consumption` - Daily consumption records
   - `notifications` - System notifications
   - `system_logs` - Activity logs
   - Row Level Security policies
   - Indexes for performance

## 🤖 Telegram Bot Setup

1. **Create a Telegram Bot**
   - Message @BotFather on Telegram
   - Use `/newbot` command
   - Get your bot token

2. **Get your Chat ID**
   - Message your bot
   - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find your chat ID in the response

3. **Add tokens to your environment file**

## 🏃‍♂️ Running the Application

1. **Development mode**
   ```bash
   npm run dev
   ```

2. **Production build**
   ```bash
   npm run build
   npm start
   ```

3. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Usage

### Dashboard
- View current power status
- See consumption statistics
- Monitor system health

### Power Status
- Report power outages
- Mark power restoration
- View outage history

### Consumption Tracking
- Add daily meter readings
- View consumption charts
- Track costs and trends

### Notifications
- Configure notification preferences
- View notification history
- Test Telegram integration

### System Logs
- Monitor all system activities
- Filter and search logs
- Export log data

## 🔧 Configuration

### Notification Types
- `power_outage` - When power goes out
- `power_restored` - When power comes back
- `daily_summary` - Daily consumption summary
- `weekly_report` - Weekly consumption report
- `maintenance_alert` - System maintenance alerts

### Database Policies
The application uses Supabase Row Level Security (RLS) to ensure data security:
- Users can only access their own data
- Public read access for power status and consumption
- Authenticated write access for data entry

## 📊 API Endpoints

### Dashboard API
- `GET /api/dashboard` - Get dashboard data
- `POST /api/dashboard` - Update power status or add consumption

### Notifications API
- `POST /api/notifications/telegram` - Send Telegram notification

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Manual Deployment
1. Build the application: `npm run build`
2. Deploy the `.next` folder to your hosting provider
3. Ensure environment variables are set

## 🔐 Security Features

- Row Level Security (RLS) enabled
- Environment variables for sensitive data
- Input validation and sanitization
- Secure API endpoints
- HTTPS enforcement in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify environment variables are set correctly
3. Ensure Supabase database is set up properly
4. Test Telegram bot configuration
5. Open an issue on GitHub

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- Real-time dashboard
- Power status tracking
- Consumption monitoring
- Telegram notifications
- System logging

---

**PowerSwitch** - Making power monitoring simple and intelligent. 🔌⚡
