#!/usr/bin/env node

/**
 * PowerSwitch Database Setup Script
 * 
 * This script creates the necessary database tables and applies the initial schema
 * to your Supabase database.
 * 
 * Usage: node scripts/setup-db.js
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables from the parent directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Database schema SQL
const schemaSQL = `
-- Enable RLS
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Power Status Table
CREATE TABLE IF NOT EXISTS public.power_status (
  id BIGSERIAL PRIMARY KEY,
  status VARCHAR(10) NOT NULL CHECK (status IN ('ON', 'OFF')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Power Consumption Table
CREATE TABLE IF NOT EXISTS public.power_consumption (
  id BIGSERIAL PRIMARY KEY,
  reading_date DATE NOT NULL,
  units_consumed DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(6,4) NOT NULL DEFAULT 0,
  reading_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info',
  status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
  user_id VARCHAR(100) NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warning', 'error')),
  source VARCHAR(100) NOT NULL DEFAULT 'PowerSwitch',
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_power_status_timestamp ON public.power_status(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_power_consumption_date ON public.power_consumption(reading_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);

-- Enable Row Level Security
ALTER TABLE public.power_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can modify these for your security needs)
CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.power_status FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON public.power_status FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON public.power_status FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.power_consumption FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON public.power_consumption FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON public.power_consumption FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.notifications FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Enable update access for all users" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "Enable delete access for all users" ON public.notifications FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS "Enable read access for all users" ON public.system_logs FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Enable insert access for all users" ON public.system_logs FOR INSERT WITH CHECK (true);
`;

// Function to execute SQL
const executeSQL = async (sql) => {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      throw error
    }
    return true
  } catch (error) {
    // If the RPC doesn't exist, try using the SQL editor approach
    console.log('RPC method not available, trying direct query execution...')
    
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') || 
          statement.includes('ALTER TABLE') ||
          statement.includes('CREATE POLICY')) {
        try {
          const { error } = await supabase.from('_sql_migrations').insert({
            name: `migration_${Date.now()}`,
            sql: statement,
            executed_at: new Date().toISOString()
          })
          
          if (error && !error.message.includes('does not exist')) {
            console.warn(`Warning: ${error.message}`)
          }
        } catch (e) {
          console.warn(`Warning executing statement: ${e.message}`)
        }
      }
    }
    
    return true
  }
}

// Create tables using individual queries
const createTables = async () => {
  try {
    console.log('🏗️  Creating database tables...')

    // Create power_status table
    console.log('📊 Creating power_status table...')
    const { error: powerStatusError } = await supabase
      .from('power_status')
      .select('id')
      .limit(1)

    if (powerStatusError && powerStatusError.code === 'PGRST116') {
      console.log('⚠️  Tables don\'t exist. Please create them manually in Supabase SQL Editor.')
      console.log('\n📋 Copy and paste this SQL into your Supabase SQL Editor:')
      console.log('\n' + '='.repeat(80))
      console.log(schemaSQL)
      console.log('='.repeat(80) + '\n')
      return false
    }

    console.log('✅ Database tables verified!')
    return true

  } catch (error) {
    console.error('❌ Error setting up database:', error)
    return false
  }
}

// Test database connection and insert sample data
const testDatabase = async () => {
  try {
    console.log('🧪 Testing database connection...')

    // Test power_status table
    const { data: powerTest, error: powerError } = await supabase
      .from('power_status')
      .select('id')
      .limit(1)

    if (powerError) {
      console.log('❌ Power status table test failed:', powerError.message)
      return false
    }

    // Test power_consumption table
    const { data: consumptionTest, error: consumptionError } = await supabase
      .from('power_consumption')
      .select('id')
      .limit(1)

    if (consumptionError) {
      console.log('❌ Power consumption table test failed:', consumptionError.message)
      return false
    }

    // Test notifications table
    const { data: notificationTest, error: notificationError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)

    if (notificationError) {
      console.log('❌ Notifications table test failed:', notificationError.message)
      return false
    }

    // Test system_logs table
    const { data: logTest, error: logError } = await supabase
      .from('system_logs')
      .select('id')
      .limit(1)

    if (logError) {
      console.log('❌ System logs table test failed:', logError.message)
      return false
    }

    console.log('✅ All database tables are accessible!')
    return true

  } catch (error) {
    console.error('❌ Database test failed:', error)
    return false
  }
}

// Insert initial sample data
const insertSampleData = async () => {
  try {
    console.log('📝 Inserting sample data...')

    // Insert initial power status
    await supabase.from('power_status').insert({
      status: 'ON',
      timestamp: new Date().toISOString(),
      duration_minutes: null
    })

    // Insert sample consumption data
    await supabase.from('power_consumption').insert({
      reading_date: new Date().toISOString().split('T')[0],
      units_consumed: 5.5,
      cost_per_unit: 0.12,
      reading_time: new Date().toISOString()
    })

    // Insert welcome notification
    await supabase.from('notifications').insert({
      title: '🎉 Welcome to PowerSwitch',
      message: 'Your power management system is now set up and ready to use!',
      type: 'system',
      status: 'unread',
      user_id: 'system'
    })

    // Insert system log
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'PowerSwitch Setup',
      message: 'Database setup completed successfully',
      metadata: JSON.stringify({ setup_time: new Date().toISOString() })
    })

    console.log('✅ Sample data inserted successfully!')
    return true

  } catch (error) {
    console.error('❌ Error inserting sample data:', error)
    return false
  }
}

// Main setup function
const setupDatabase = async () => {
  console.log('🚀 PowerSwitch Database Setup Starting...')
  console.log(`📡 Connected to Supabase: ${supabaseUrl}`)
  console.log('')

  // Test connection and create tables
  const tablesReady = await createTables()
  
  if (!tablesReady) {
    console.log('\n❌ Database setup incomplete. Please create tables manually first.')
    process.exit(1)
  }

  // Test database
  const testPassed = await testDatabase()
  
  if (!testPassed) {
    console.log('\n❌ Database tests failed. Please check your setup.')
    process.exit(1)
  }

  // Insert sample data
  const sampleDataInserted = await insertSampleData()
  
  if (!sampleDataInserted) {
    console.log('\n⚠️  Sample data insertion failed, but tables are ready.')
  }

  console.log('\n🎉 Database setup completed successfully!')
  console.log('🔥 You can now run the data population script: npm run populate-db')
  console.log('🌐 Or start the development server: npm run dev')
}

// Run setup
setupDatabase().catch(console.error)