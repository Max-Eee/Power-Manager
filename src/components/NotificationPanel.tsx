"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trash2,
  Settings,
  Send,
  MessageSquare
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Notification {
  id: string
  title: string
  message: string
  type: 'power_outage' | 'power_restored' | 'daily_summary' | 'weekly_report' | 'maintenance_alert' | 'system'
  status: 'read' | 'unread'
  telegram_sent: boolean | null
  created_at: string
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [notificationSettings, setNotificationSettings] = useState({
    power_outage: true,
    power_restored: true,
    daily_summary: true,
    weekly_report: false,
    maintenance_alerts: true
  })

  useEffect(() => {
    fetchNotifications()
    
    // Set up real-time subscription
    const setupSubscription = async () => {
      try {
        const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
        if (!isSupabaseAvailable()) {
          console.log('Supabase not configured, skipping realtime subscription')
          return
        }

        const supabase = getSupabaseClient()
        const subscription = supabase
          .channel('notifications-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            () => {
              fetchNotifications()
            }
          )
          .subscribe()

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Failed to setup subscription:', error)
        return () => {}
      }
    }
    
    setupSubscription()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, skipping notifications fetch')
        return
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, cannot mark as read')
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, status: 'read' as const } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => n.status === 'unread')
        .map(n => n.id)

      if (unreadIds.length === 0) return

      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, cannot mark all as read')
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .in('id', unreadIds)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read' as const }))
      )
      
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, cannot delete notification')
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const testNotification = async () => {
    try {
      // Create a test notification in database
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        toast.error('Database not configured. Please check your Supabase settings.')
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('notifications')
        .insert({
          title: '🧪 Test Notification',
          message: 'This is a test notification to verify the system is working properly.',
          type: 'system',
          user_id: 'test-user' // In real app, this would be the current user's ID
        })

      if (error) throw error

      // Also send to Telegram
      try {
        const telegramResponse = await fetch('/api/notifications/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'test',
            status: 'TEST',
            message: 'Test notification sent from PowerSwitch dashboard'
          }),
        })

        if (telegramResponse.ok) {
          toast.success('Test notification created and sent to Telegram!')
        } else {
          const error = await telegramResponse.json()
          console.error('Telegram error:', error)
          toast.success('Test notification created in database, but Telegram failed')
        }
      } catch (telegramError) {
        console.error('Error sending to Telegram:', telegramError)
        toast.success('Test notification created in database, but Telegram failed')
      }

    } catch (error) {
      console.error('Error creating test notification:', error)
      toast.error('Failed to create test notification')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'power_outage':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'power_restored':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'daily_summary':
      case 'weekly_report':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'maintenance_alert':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'power_outage':
        return 'destructive'
      case 'power_restored':
        return 'default'
      case 'daily_summary':
      case 'weekly_report':
        return 'secondary'
      case 'maintenance_alert':
        return 'warning'
      default:
        return 'outline'
    }
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Stay updated with power status and system events
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={testNotification}
          >
            <Send className="h-4 w-4 mr-2" />
            Test
          </Button>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(notificationSettings).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor={key} className="text-sm font-medium capitalize">
                    {key.replace('_', ' ')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {key === 'power_outage' && 'Get notified when power goes out'}
                    {key === 'power_restored' && 'Get notified when power is restored'}
                    {key === 'daily_summary' && 'Receive daily consumption summary'}
                    {key === 'weekly_report' && 'Receive weekly consumption report'}
                    {key === 'maintenance_alerts' && 'Get system maintenance alerts'}
                  </p>
                </div>
                <Switch
                  id={key}
                  checked={enabled}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, [key]: checked }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  notification.status === 'unread' 
                    ? 'bg-muted/50 border-primary/20' 
                    : 'hover:bg-muted/20'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{notification.title}</h4>
                        <Badge 
                          variant={getNotificationBadgeColor(notification.type) as any}
                          className="text-xs"
                        >
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        {notification.status === 'unread' && (
                          <Badge variant="destructive" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(notification.created_at), 'MMM d, yyyy HH:mm')}</span>
                        {notification.telegram_sent === true && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Telegram sent
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {notification.status === 'unread' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 px-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground mb-4">
                  You'll receive notifications about power status changes and system updates here.
                </p>
                <Button onClick={testNotification} variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}