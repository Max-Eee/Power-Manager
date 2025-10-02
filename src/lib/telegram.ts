import { Telegraf } from 'telegraf'
import { isSupabaseAvailable, getSupabaseClient } from '@/lib/supabase'

export interface TelegramMessage {
  title: string
  message: string
  chatId?: string
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
}

class TelegramService {
  private bot: Telegraf | null = null
  private defaultChatId: string | null = null

  constructor() {
    this.initializeBot()
  }

  private initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!token) {
      console.warn('Telegram bot token not configured')
      return
    }

    this.bot = new Telegraf(token)
    this.defaultChatId = chatId || null

    // Set up bot commands
    this.setupCommands()
  }

  private setupCommands() {
    if (!this.bot) return

    this.bot.start((ctx) => {
      ctx.reply(
        '🔌 Welcome to PowerSwitch Bot!\n\n' +
        'This bot will notify you about power status changes and consumption updates.\n\n' +
        'Available commands:\n' +
        '/status - Get current power status\n' +
        '/consumption - Get latest consumption data\n' +
        '/help - Show this help message'
      )
    })

    this.bot.command('status', async (ctx) => {
      try {
        if (!isSupabaseAvailable()) {
          ctx.reply('❌ Database not configured')
          return
        }

        const supabase = getSupabaseClient()
        const { data: status } = await supabase
          .from('power_status')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        if (status) {
          const emoji = status.status === 'ON' ? '🟢' : '🔴'
          const duration = status.duration_minutes 
            ? ` (${Math.round(status.duration_minutes)} minutes)`
            : ''
          
          ctx.reply(
            `${emoji} Power Status: ${status.status}${duration}\n` +
            `📅 Last updated: ${new Date(status.timestamp).toLocaleString()}`
          )
        } else {
          ctx.reply('❌ No power status data available')
        }
      } catch (error) {
        console.error('Error fetching power status:', error)
        ctx.reply('❌ Error fetching power status')
      }
    })

    this.bot.command('consumption', async (ctx) => {
      try {
        if (!isSupabaseAvailable()) {
          ctx.reply('❌ Database not configured')
          return
        }

        const supabase = getSupabaseClient()
        const { data: consumption } = await supabase
          .from('power_consumption')
          .select('*')
          .order('reading_date', { ascending: false })
          .limit(5)

        if (consumption && consumption.length > 0) {
          let message = '⚡ Latest Power Consumption:\n\n'
          
          consumption.forEach((record, index) => {
            const date = new Date(record.reading_date).toLocaleDateString()
            message += `${index + 1}. ${date}: ${record.units_consumed} units (₹${record.total_cost})\n`
          })

          ctx.reply(message)
        } else {
          ctx.reply('❌ No consumption data available')
        }
      } catch (error) {
        console.error('Error fetching consumption:', error)
        ctx.reply('❌ Error fetching consumption data')
      }
    })

    this.bot.help((ctx) => {
      ctx.reply(
        '🔌 PowerSwitch Bot Help\n\n' +
        'Available commands:\n' +
        '/start - Start the bot\n' +
        '/status - Get current power status\n' +
        '/consumption - Get latest consumption data\n' +
        '/help - Show this help message\n\n' +
        'You will receive automatic notifications for:\n' +
        '• Power outages 🔴\n' +
        '• Power restoration 🟢\n' +
        '• Daily summaries 📊\n' +
        '• System alerts ⚠️'
      )
    })
  }

  async sendMessage({ title, message, chatId, parseMode = 'HTML' }: TelegramMessage): Promise<boolean> {
    if (!this.bot) {
      console.warn('Telegram bot not initialized')
      return false
    }

    const targetChatId = chatId || this.defaultChatId
    if (!targetChatId) {
      console.warn('No chat ID configured for Telegram')
      return false
    }

    try {
      const fullMessage = `<b>${title}</b>\n\n${message}`
      
      await this.bot.telegram.sendMessage(targetChatId, fullMessage, {
        parse_mode: parseMode,
        link_preview_options: { is_disabled: true }
      })

      return true
    } catch (error) {
      console.error('Error sending Telegram message:', error)
      return false
    }
  }

  async sendPowerStatusNotification(status: 'ON' | 'OFF', duration?: number): Promise<boolean> {
    const emoji = status === 'ON' ? '🟢' : '🔴'
    const title = `${emoji} Power ${status === 'ON' ? 'Restored' : 'Outage'}`
    
    let message = `Power is now <b>${status}</b>`
    
    if (duration && status === 'ON') {
      message += `\nOutage duration: ${Math.round(duration)} minutes`
    }
    
    message += `\nTime: ${new Date().toLocaleString()}`

    return this.sendMessage({ title, message })
  }

  async sendDailySummary(data: {
    consumptionUnits: number
    estimatedCost: number
    powerStatus: 'ON' | 'OFF'
    outageCount: number
    totalOutageTime: number
  }): Promise<boolean> {
    const title = '📊 Daily Power Summary'
    
    const message = `
<b>Consumption:</b> ${data.consumptionUnits} units
<b>Estimated Cost:</b> ₹${data.estimatedCost.toFixed(2)}
<b>Current Status:</b> ${data.powerStatus === 'ON' ? '🟢 ON' : '🔴 OFF'}
<b>Outages Today:</b> ${data.outageCount}
<b>Total Outage Time:</b> ${Math.round(data.totalOutageTime)} minutes

📅 Date: ${new Date().toLocaleDateString()}
    `.trim()

    return this.sendMessage({ title, message })
  }

  async sendMaintenanceAlert(message: string): Promise<boolean> {
    const title = '⚠️ Maintenance Alert'
    return this.sendMessage({ title, message })
  }

  // Start the bot (for webhook or polling)
  launch() {
    if (!this.bot) {
      console.warn('Cannot launch Telegram bot - not initialized')
      return
    }

    this.bot.launch()
    console.log('Telegram bot started')

    // Enable graceful stop
    process.once('SIGINT', () => this.bot?.stop('SIGINT'))
    process.once('SIGTERM', () => this.bot?.stop('SIGTERM'))
  }

  // For webhook setup (production)
  getWebhookCallback() {
    if (!this.bot) throw new Error('Bot not initialized')
    return this.bot.webhookCallback('/api/telegram-webhook')
  }
}

export const telegramService = new TelegramService()

// Export for API routes
export default telegramService