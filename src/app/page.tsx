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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Power className="h-8 w-8 text-primary" />
            PowerSwitch
          </h1>
          <p className="text-muted-foreground mt-1">
            Power Management & Monitoring System
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {currentPowerStatus && (
            <Badge 
              variant={currentPowerStatus.status === 'ON' ? 'default' : 'destructive'}
              className="text-sm font-semibold px-3 py-1"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                currentPowerStatus.status === 'ON' 
                  ? 'bg-green-500 animate-pulse' 
                  : 'bg-red-500'
              }`} />
              Power {currentPowerStatus.status}
            </Badge>
          )}
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="power" className="flex items-center gap-2">
            <Power className="h-4 w-4" />
            Power Status
          </TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Consumption
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

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
