"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Power, 
  Clock, 
  Zap, 
  AlertCircle,
  CheckCircle,
  History
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface PowerStatusData {
  id: string
  status: 'ON' | 'OFF'
  timestamp: string
  duration_minutes: number | null
}

interface PowerStatusProps {
  currentStatus: PowerStatusData | null
  onStatusChange: () => void
}

export default function PowerStatus({ currentStatus, onStatusChange }: PowerStatusProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [recentHistory, setRecentHistory] = useState<PowerStatusData[]>([])

  const updatePowerStatus = async (newStatus: 'ON' | 'OFF') => {
    setIsUpdating(true)
    
    try {
      // Calculate duration if switching from OFF to ON
      let duration_minutes = null
      if (newStatus === 'ON' && currentStatus?.status === 'OFF') {
        const outageStart = new Date(currentStatus.timestamp)
        const now = new Date()
        duration_minutes = Math.round((now.getTime() - outageStart.getTime()) / (1000 * 60))
      }

      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        toast.error('Database not configured. Please check your Supabase settings.')
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('power_status')
        .insert({
          status: newStatus,
          duration_minutes,
          timestamp: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          action: 'POWER_STATUS_UPDATE',
          description: `Power status changed to ${newStatus}`,
          metadata: { 
            previous_status: currentStatus?.status,
            new_status: newStatus,
            duration_minutes 
          }
        })

      toast.success(`Power status updated to ${newStatus}`)
      onStatusChange()
      
      // Send Telegram notification (API call)
      if (process.env.NODE_ENV !== 'development') {
        fetch('/api/notifications/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: newStatus === 'ON' ? 'power_restored' : 'power_outage',
            status: newStatus,
            duration: duration_minutes
          })
        })
      }
      
    } catch (error) {
      console.error('Error updating power status:', error)
      toast.error('Failed to update power status')
    } finally {
      setIsUpdating(false)
    }
  }

  const fetchRecentHistory = async () => {
    const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
    if (!isSupabaseAvailable()) {
      console.log('Supabase not configured, skipping history fetch')
      return
    }

    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('power_status')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching history:', error)
    } else {
      setRecentHistory(data || [])
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Power className={`h-6 w-6 ${
              currentStatus?.status === 'ON' ? 'text-green-500' : 'text-red-500'
            }`} />
            Current Power Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Badge 
                variant={currentStatus?.status === 'ON' ? 'default' : 'destructive'}
                className="text-xl font-bold px-4 py-2"
              >
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  currentStatus?.status === 'ON' 
                    ? 'bg-green-500 animate-pulse' 
                    : 'bg-red-500'
                }`} />
                Power {currentStatus?.status || 'Unknown'}
              </Badge>
              
              {currentStatus && (
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Last updated: {format(new Date(currentStatus.timestamp), 'PPp')}
                  </div>
                  
                  {currentStatus.duration_minutes && currentStatus.status === 'ON' && (
                    <div className="flex items-center gap-2 mt-1">
                      <Zap className="h-4 w-4" />
                      Outage duration: {Math.round(currentStatus.duration_minutes)} minutes
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-right">
              {currentStatus?.status === 'ON' ? (
                <CheckCircle className="h-16 w-16 text-green-500" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-500" />
              )}
            </div>
          </div>

          {/* Status Toggle Controls */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Update Power Status</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isUpdating || currentStatus?.status === 'OFF'}
                    className="h-16 flex-col gap-2 border-red-200 hover:border-red-300 hover:bg-red-50"
                  >
                    <AlertCircle className="h-6 w-6 text-red-500" />
                    Report Outage
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Report Power Outage</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to report a power outage? This will change the status to OFF and send notifications.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => updatePowerStatus('OFF')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Report Outage
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={isUpdating || currentStatus?.status === 'ON'}
                    className="h-16 flex-col gap-2 border-green-200 hover:border-green-300 hover:bg-green-50"
                  >
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    Power Restored
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Power Restoration</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark power as restored? This will change the status to ON and calculate the outage duration.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => updatePowerStatus('ON')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Confirm Restoration
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <p className="text-2xl font-bold">
                  {currentStatus?.status || 'Unknown'}
                </p>
              </div>
              <Power className={`h-8 w-8 ${
                currentStatus?.status === 'ON' ? 'text-green-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Update</p>
                <p className="text-lg font-bold">
                  {currentStatus 
                    ? format(new Date(currentStatus.timestamp), 'HH:mm')
                    : '--:--'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {currentStatus?.status === 'ON' ? 'Uptime' : 'Outage Duration'}
                </p>
                <p className="text-lg font-bold">
                  {currentStatus?.duration_minutes 
                    ? `${Math.round(currentStatus.duration_minutes)} min`
                    : 'N/A'
                  }
                </p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent History
          </CardTitle>
          <Button 
            variant="outline" 
            onClick={fetchRecentHistory}
            size="sm"
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentHistory.slice(0, 5).map((record, index) => (
              <div 
                key={record.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={record.status === 'ON' ? 'default' : 'destructive'}
                    className="min-w-[60px] justify-center"
                  >
                    {record.status}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      {format(new Date(record.timestamp), 'MMM d, yyyy HH:mm')}
                    </p>
                    {record.duration_minutes && record.status === 'ON' && (
                      <p className="text-sm text-muted-foreground">
                        Outage: {Math.round(record.duration_minutes)} minutes
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right text-sm text-muted-foreground">
                  {index === 0 && 'Current'}
                  {index === 1 && 'Previous'}
                  {index > 1 && `${index} changes ago`}
                </div>
              </div>
            ))}
            
            {recentHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2" />
                <p>No history available</p>
                <p className="text-sm">Status changes will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}