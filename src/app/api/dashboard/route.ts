import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
    if (!isSupabaseAvailable()) {
      return NextResponse.json({
        powerStatus: null,
        consumption: { total: 0, average: 0, records: 0 },
        notifications: { unread: 0 },
        system: { uptime: '⚠️ Not configured', lastUpdate: new Date().toISOString() }
      })
    }

    const supabase = getSupabaseClient()
    // Get power status
    const { data: powerStatus } = await supabase
      .from('power_status')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    // Get recent consumption
    const { data: consumption } = await supabase
      .from('power_consumption')
      .select('*')
      .order('reading_date', { ascending: false })
      .limit(7)

    // Get notifications count
    const { count: notificationCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'unread')

    // Calculate some basic stats
    const totalConsumption = consumption?.reduce((sum, record) => sum + record.units_consumed, 0) || 0
    const averageConsumption = consumption?.length ? totalConsumption / consumption.length : 0
    
    return NextResponse.json({
      powerStatus: powerStatus ? {
        status: powerStatus.status,
        timestamp: powerStatus.timestamp,
        duration_minutes: powerStatus.duration_minutes
      } : null,
      consumption: {
        total: totalConsumption,
        average: averageConsumption,
        records: consumption?.length || 0
      },
      notifications: {
        unread: notificationCount || 0
      },
      system: {
        uptime: powerStatus?.status === 'ON' ? '✅ Online' : '⚠️ Offline',
        lastUpdate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json()

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
    if (!isSupabaseAvailable()) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    
    const supabase = getSupabaseClient()
    let result

    switch (action) {
      case 'update_power_status':
        result = await supabase
          .from('power_status')
          .insert({
            status: data.status,
            duration_minutes: data.duration_minutes,
            timestamp: new Date().toISOString()
          })
        break

      case 'add_consumption':
        result = await supabase
          .from('power_consumption')
          .insert({
            reading_date: data.reading_date,
            units_consumed: data.units_consumed,
            cost_per_unit: data.cost_per_unit
          })
        break

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    if (result.error) {
      throw result.error
    }

    return NextResponse.json({ success: true, data: result.data })

  } catch (error) {
    console.error('Error in dashboard API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}