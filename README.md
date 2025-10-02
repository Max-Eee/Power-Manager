# <i>**`Power-Manager`** - Web Application for Power Management</i>

A comprehensive **`power monitoring platform`** built with modern web technologies for tracking electricity consumption, managing bills, analytics, and power-related notifications.

<samp>

## 🌐 Live Application

**Access Now**: [**Power-Manager**](https://max-eee.github.io/Power-Manager/) <br>
Monitor and manage your power consumption directly in your browser with real-time data integration.
  
> [!IMPORTANT]
> **Next.js Integration**: This application uses Next.js 15 with Supabase for real-time data handling and storage.
> 
> **Smart Notifications**: Set up power limit alerts via Telegram bot to stay informed about consumption thresholds and take timely action.

## 🎴 Design

### Dashboard Overview
**Main Dashboard**
<img width="2317" height="1181" alt="image" src="https://github.com/user-attachments/assets/d350058e-03fd-4c28-9ff9-477783701264" />

**Analytics View**
<img width="2254" height="1155" alt="image" src="https://github.com/user-attachments/assets/73181de8-9ee2-4484-bba5-57148961e37b" />

### Activity Logs
<img width="2222" height="1000" alt="image" src="https://github.com/user-attachments/assets/386359d8-278f-414c-a717-2f12d5e0deda" />

### Notification System
<img width="2285" height="1075" alt="image" src="https://github.com/user-attachments/assets/c45657f3-95c8-4ad1-93a4-6a0d6519d83d" />


## ✨ Features

- **`Comprehensive Dashboard`** : Real-time overview of power consumption with visual analytics and key metrics
- **`Next.js Framework`** : Modern React-based application with server-side rendering and API routes
- **`Supabase Integration`** : Real-time database with PostgreSQL and Row Level Security for data management
- **`Power Analytics`** : Advanced charting and statistical analysis of consumption patterns and trends
- **`Bill Management`** : Track and manage electricity bills with detailed breakdown and cost analysis
- **`Smart Notifications`** : Telegram bot integration for power limit alerts and consumption milestones
- **`Activity Logging`** : Comprehensive logging system for all power-related events and activities
- **`Real-time Monitoring`** : Live updates and monitoring of power consumption and system status
- **`Data Visualization`** : Interactive charts powered by Recharts for better understanding of usage patterns
- **`Responsive Design`** : Optimized for desktop, tablet, and mobile devices with Shadcn/UI components
- **`TypeScript Support`** : Full type safety and enhanced developer experience
- **`Production Ready`** : Built with modern best practices and security considerations

## � Technical Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Database**: Supabase (PostgreSQL) with real-time subscriptions
- **Styling**: Tailwind CSS with Shadcn/UI component library
- **Charts**: Recharts for interactive data visualization
- **Notifications**: Telegram Bot API integration
- **Icons**: Lucide React icon library
- **Development**: Turbopack, ESLint, Hot reload

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Max-Eee/Power-Manager.git
   cd Power-Manager
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
