import { NextRequest, NextResponse } from 'next/server'

function getTelegramMessage(type: string, status?: string, duration?: number, customMessage?: string): string {
  if (type === 'test') {
    return `🧪 *Test Notification*\n\n${customMessage || 'This is a test notification from PowerSwitch!'}\n\nTime: ${new Date().toLocaleString()}`
  }
  
  if (status === 'ON') {
    return `🟢 *Power Restored*\n\nPower has been restored${duration ? ` after ${Math.round(duration)} minutes` : ''}.\n\nTime: ${new Date().toLocaleString()}`
  } else {
    return `🔴 *Power Outage*\n\nPower outage detected.\n\nTime: ${new Date().toLocaleString()}`
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, status, duration, message } = await req.json()

    if (!type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create notification record if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, skipping notification creation')
      } else {
        const supabase = getSupabaseClient()
        let notificationData
        if (type === 'test') {
          notificationData = {
            title: '🧪 Test Notification',
            message: message || 'Test notification sent from PowerSwitch API',
            type: 'system',
            user_id: 'system'
          }
        } else {
          notificationData = {
            title: status === 'ON' ? '🟢 Power Restored' : '🔴 Power Outage',
            message: status === 'ON' 
              ? `Power has been restored${duration ? ` after ${Math.round(duration)} minutes` : ''}.`
              : 'Power outage detected. We will notify you when power is restored.',
            type: status === 'ON' ? 'power_restored' : 'power_outage',
            user_id: 'system' // In real app, this would be dynamic
          }
        }

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationData as any)

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
        }
      }
    }

    // Send Telegram notification
    try {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: getTelegramMessage(type, status, duration, message),
          parse_mode: 'Markdown'
        }),
      })

      if (!telegramResponse.ok) {
        throw new Error(`Telegram API error: ${telegramResponse.statusText}`)
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification sent successfully' 
      })

    } catch (telegramError) {
      console.error('Error sending Telegram message:', telegramError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send Telegram notification',
        details: telegramError instanceof Error ? telegramError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in telegram notification API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}