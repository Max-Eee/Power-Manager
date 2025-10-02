-- PowerSwitch Database Quick Setup
-- Copy and paste this entire SQL into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create power_status table (simplified for quick testing)
CREATE TABLE IF NOT EXISTS public.power_status (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(10) NOT NULL CHECK (status IN ('ON', 'OFF')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create power_consumption table (simplified)
CREATE TABLE IF NOT EXISTS public.power_consumption (
    id BIGSERIAL PRIMARY KEY,
    reading_date DATE NOT NULL,
    units_consumed DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_per_unit DECIMAL(6,4) NOT NULL DEFAULT 0,
    reading_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table (simplified)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
    user_id VARCHAR(100) NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create system_logs table (simplified)
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

-- Create policies for public access (for testing - you can tighten security later)
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

-- Insert some initial sample data
INSERT INTO public.power_status (status, timestamp, duration_minutes) 
VALUES ('ON', NOW(), NULL);

INSERT INTO public.power_consumption (reading_date, units_consumed, cost_per_unit, reading_time)
VALUES (CURRENT_DATE, 0.0, 0.12, NOW());

INSERT INTO public.notifications (title, message, type, status, user_id)
VALUES ('🎉 Welcome to PowerSwitch', 'Your power management system is ready!', 'system', 'unread', 'system');

INSERT INTO public.system_logs (level, source, message, metadata)
VALUES ('info', 'PowerSwitch Setup', 'Database initialized successfully', '{"setup_time": "' || NOW() || '"}'::jsonb);