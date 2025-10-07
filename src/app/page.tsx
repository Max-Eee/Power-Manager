"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Power, 
  Zap, 
  Bell, 
  Clock,
  BarChart3,
  Settings,
  Activity
} from 'lucide-react'
import Dashboard from '@/components/Dashboard'
import PowerStatus from '@/components/PowerStatus'
import ConsumptionChart from '@/components/ConsumptionChart'
import NotificationPanel from '@/components/NotificationPanel'
import SystemLogs from '@/components/SystemLogs'

interface PowerStatusData {
  id: string
  status: 'ON' | 'OFF'
  timestamp: string
  duration_minutes: number | null
}

interface ConsumptionData {
  id: string
  reading_date: string
  units_consumed: number
  total_cost: number | null
  cost_per_unit: number
}

export default function Home() {
  const [currentPowerStatus, setCurrentPowerStatus] = useState<PowerStatusData | null>(null)
  const [recentConsumption, setRecentConsumption] = useState<ConsumptionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInitialData()
    
    // Set up real-time subscriptions
    setupRealtimeSubscriptions()
  }, [])

  const setupRealtimeSubscriptions = async () => {
    const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
    if (!isSupabaseAvailable()) {
      console.log('Supabase not configured, skipping realtime subscriptions')
      return () => {}
    }
    
    const supabase = getSupabaseClient()
    
    const powerStatusSubscription = supabase
      .channel('power-status-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'power_status' },
        () => {
          fetchPowerStatus()
        }
      )
      .subscribe()

    const consumptionSubscription = supabase
      .channel('consumption-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'power_consumption' },
        () => {
          fetchConsumption()
        }
      )
      .subscribe()

    return () => {
      powerStatusSubscription.unsubscribe()
      consumptionSubscription.unsubscribe()
    }
  }

  const fetchInitialData = async () => {
    setLoading(true)
    await Promise.all([
      fetchPowerStatus(),
      fetchConsumption()
    ])
    setLoading(false)
  }

  const fetchPowerStatus = async () => {
    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, skipping power status fetch')
        return
      }
      
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('power_status')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('Error fetching power status:', error)
      } else {
        setCurrentPowerStatus(data)
      }
    } catch (error) {
      console.error('Error in fetchPowerStatus:', error)
    }
  }

  const fetchConsumption = async () => {
    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, skipping consumption fetch')
        return
      }
      
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('power_consumption')
        .select('*')
        .order('reading_date', { ascending: false })
        .limit(7)

      if (error) {
        console.error('Error fetching consumption:', error)
      } else {
        setRecentConsumption(data || [])
      }
    } catch (error) {
      console.error('Error in fetchConsumption:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading PowerSwitch data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Power className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            PowerSwitch
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Power Management & Monitoring System
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {currentPowerStatus && (
            <Badge 
              variant={currentPowerStatus.status === 'ON' ? 'default' : 'destructive'}
              className="text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1"
            >
              <div className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${
                currentPowerStatus.status === 'ON' 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`} />
              Power {currentPowerStatus.status}
            </Badge>
          )}
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <TabsList className="grid w-full min-w-max grid-cols-5 md:w-full md:min-w-0">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Power className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Power Status</span>
            </TabsTrigger>
            <TabsTrigger value="consumption" className="flex items-center gap-2">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Consumption</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          <Dashboard 
            powerStatus={currentPowerStatus}
            consumptionData={recentConsumption}
          />
        </TabsContent>

        <TabsContent value="power" className="space-y-6">
          <PowerStatus 
            currentStatus={currentPowerStatus}
            onStatusChange={fetchPowerStatus}
          />
        </TabsContent>

        <TabsContent value="consumption" className="space-y-6">
          <ConsumptionChart 
            data={recentConsumption}
            onDataChange={fetchConsumption}
          />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationPanel />
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <SystemLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
