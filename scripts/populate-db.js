#!/usr/bin/env node

/**
 * PowerSwitch Database Population Script
 * 
 * This script populates the Supabase database with realistic power management data
 * every 10 seconds to simulate a live power monitoring system.
 * 
 * Usage: node scripts/populate-db.js
 * 
 * Make sure to set up your .env.local file with proper Supabase credentials before running.
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

// Configuration
const INTERVAL_MS = 10000 // 10 seconds
let isRunning = true
let currentPowerStatus = 'ON' // Track current power status
let lastOutageStart = null

// Realistic data generators
const generatePowerStatus = () => {
  // 95% chance power stays the same, 5% chance it changes
  const shouldChange = Math.random() < 0.05
  
  if (shouldChange) {
    if (currentPowerStatus === 'ON') {
      currentPowerStatus = 'OFF'
      lastOutageStart = new Date()
      console.log('🔴 Simulating power outage')
    } else {
      currentPowerStatus = 'ON'
      console.log('🟢 Simulating power restoration')
    }
  }

  let duration_minutes = null
  if (currentPowerStatus === 'ON' && lastOutageStart) {
    duration_minutes = Math.round((new Date() - lastOutageStart) / (1000 * 60))
    lastOutageStart = null // Reset after restoration
  }

  return {
    status: currentPowerStatus,
    timestamp: new Date().toISOString(),
    duration_minutes
  }
}

const generateConsumption = () => {
  // Generate realistic consumption data
  const hour = new Date().getHours()
  
  // Base consumption varies by time of day
  let baseConsumption
  if (hour >= 6 && hour <= 9) {
    baseConsumption = 8 + Math.random() * 4 // Morning peak: 8-12 kWh
  } else if (hour >= 18 && hour <= 22) {
    baseConsumption = 10 + Math.random() * 6 // Evening peak: 10-16 kWh
  } else if (hour >= 23 || hour <= 5) {
    baseConsumption = 3 + Math.random() * 2 // Night: 3-5 kWh
  } else {
    baseConsumption = 5 + Math.random() * 3 // Day: 5-8 kWh
  }

  // If power is OFF, consumption is 0
  const units_consumed = currentPowerStatus === 'OFF' ? 0 : Math.round(baseConsumption * 100) / 100
  
  return {
    reading_date: new Date().toISOString().split('T')[0], // Today's date
    units_consumed,
    cost_per_unit: 0.12 + (Math.random() * 0.08), // $0.12 - $0.20 per kWh
    reading_time: new Date().toISOString()
  }
}

const generateNotification = (powerStatus) => {
  // Only create notifications when power status changes
  if (powerStatus.status === 'OFF' && !powerStatus.duration_minutes) {
    return {
      title: '🔴 Power Outage Detected',
      message: `Power outage detected at ${new Date().toLocaleTimeString()}. Monitoring for restoration.`,
      type: 'power_outage',
      status: 'unread',
      user_id: 'system'
    }
  } else if (powerStatus.status === 'ON' && powerStatus.duration_minutes) {
    return {
      title: '🟢 Power Restored',
      message: `Power has been restored after ${powerStatus.duration_minutes} minutes of outage.`,
      type: 'power_restored',
      status: 'unread',
      user_id: 'system'
    }
  }
  return null
}

const generateSystemLog = (type, data) => {
  let message = ''
  
  switch (type) {
    case 'power_status':
      message = `Power status updated: ${data.status}${data.duration_minutes ? ` (outage duration: ${data.duration_minutes}m)` : ''}`
      break
    case 'consumption':
      message = `Energy consumption recorded: ${data.units_consumed} kWh (Cost: $${(data.units_consumed * data.cost_per_unit).toFixed(2)})`
      break
    case 'notification':
      message = `Notification created: ${data.title}`
      break
    default:
      message = 'System activity recorded'
  }

  return {
    action: type,
    description: message,
    user_id: 'system',
    ip_address: null,
    user_agent: 'PowerSwitch Simulator',
    metadata: JSON.stringify(data)
  }
}

// Database operations
const insertPowerStatus = async (data) => {
  const { error } = await supabase
    .from('power_status')
    .insert(data)

  if (error) {
    console.error('Error inserting power status:', error)
    return false
  }
  return true
}

const insertConsumption = async (data) => {
  // First check if we already have a record for today
  const { data: existing } = await supabase
    .from('power_consumption')
    .select('id, units_consumed')
    .eq('reading_date', data.reading_date)
    .single()

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from('power_consumption')
      .update({ 
        units_consumed: existing.units_consumed + data.units_consumed,
        reading_time: data.reading_time 
      })
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating consumption:', error)
      return false
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from('power_consumption')
      .insert(data)

    if (error) {
      console.error('Error inserting consumption:', error)
      return false
    }
  }
  return true
}

const insertNotification = async (data) => {
  if (!data) return true

  const { error } = await supabase
    .from('notifications')
    .insert(data)

  if (error) {
    console.error('Error inserting notification:', error)
    return false
  }
  return true
}

const insertSystemLog = async (data) => {
  const { error } = await supabase
    .from('system_logs')
    .insert(data)

  if (error) {
    console.error('Error inserting system log:', error)
    return false
  }
  return true
}

// Main simulation function
const simulateData = async () => {
  try {
    console.log(`\n⚡ [${new Date().toLocaleTimeString()}] Generating data...`)

    // Generate power status
    const powerStatus = generatePowerStatus()
    const powerSuccess = await insertPowerStatus(powerStatus)
    
    if (powerSuccess) {
      console.log(`📊 Power Status: ${powerStatus.status}${powerStatus.duration_minutes ? ` (${powerStatus.duration_minutes}m outage)` : ''}`)
      await insertSystemLog(generateSystemLog('power_status', powerStatus))
    }

    // Generate consumption data
    const consumption = generateConsumption()
    const consumptionSuccess = await insertConsumption(consumption)
    
    if (consumptionSuccess) {
      console.log(`⚡ Consumption: ${consumption.units_consumed} kWh @ $${consumption.cost_per_unit.toFixed(3)}/kWh`)
      await insertSystemLog(generateSystemLog('consumption', consumption))
    }

    // Generate notification if power status changed
    const notification = generateNotification(powerStatus)
    if (notification) {
      const notificationSuccess = await insertNotification(notification)
      if (notificationSuccess) {
        console.log(`🔔 Notification: ${notification.title}`)
        await insertSystemLog(generateSystemLog('notification', notification))
      }
    }

    console.log('✅ Data generation complete')

  } catch (error) {
    console.error('❌ Error during simulation:', error)
  }
}

// Cleanup function
const cleanup = async () => {
  console.log('\n🛑 Shutting down simulator...')
  isRunning = false
  
  // Insert final system log
  await insertSystemLog({
    timestamp: new Date().toISOString(),
    level: 'info',
    source: 'PowerSwitch Simulator',
    message: 'Data simulation stopped',
    metadata: JSON.stringify({ reason: 'manual_stop' })
  })
  
  console.log('👋 Simulator stopped')
  process.exit(0)
}

// Handle graceful shutdown
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

// Start the simulation
const startSimulation = async () => {
  console.log('🚀 PowerSwitch Database Population Script Started')
  console.log(`📡 Connected to Supabase: ${supabaseUrl}`)
  console.log(`⏱️  Generating data every ${INTERVAL_MS / 1000} seconds`)
  console.log('Press Ctrl+C to stop\n')

  // Insert startup log
  await insertSystemLog({
    timestamp: new Date().toISOString(),
    level: 'info',
    source: 'PowerSwitch Simulator',
    message: 'Data simulation started',
    metadata: JSON.stringify({ interval_ms: INTERVAL_MS })
  })

  // Run initial simulation
  await simulateData()

  // Set up interval
  const interval = setInterval(async () => {
    if (!isRunning) {
      clearInterval(interval)
      return
    }
    await simulateData()
  }, INTERVAL_MS)
}

// Start the simulation
startSimulation().catch(console.error)