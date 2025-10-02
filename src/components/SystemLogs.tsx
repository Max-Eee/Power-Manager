"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Clock, 
  Search, 
  Filter, 
  Download,
  Activity,
  User,
  Globe,
  RefreshCw,
  Zap,
  BarChart3,
  Bell,
  AlertCircle,
  Settings,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'

interface SystemLog {
  id: string
  action: string
  description: string
  user_id: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: any
  created_at: string
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([])

  useEffect(() => {
    fetchLogs()
    
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
          .channel('logs-changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'system_logs' },
            () => {
              fetchLogs()
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

  useEffect(() => {
    // Filter logs based on search and action filter
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => (log.action || 'unknown') === actionFilter)
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, actionFilter])

  const fetchLogs = async () => {
    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        console.log('Supabase not configured, skipping logs fetch')
        return
      }

      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'power_status':
        return 'default'
      case 'consumption':
        return 'secondary'
      case 'notification':
        return 'secondary'
      case 'user_login':
      case 'user_logout':
        return 'outline'
      case 'system_error':
        return 'destructive'
      case 'maintenance':
        return 'warning'
      case 'unknown':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'power_status':
        return <Zap className="h-4 w-4" />
      case 'consumption':
        return <BarChart3 className="h-4 w-4" />
      case 'notification':
        return <Bell className="h-4 w-4" />
      case 'user_login':
      case 'user_logout':
        return <User className="h-4 w-4" />
      case 'system_error':
        return <AlertCircle className="h-4 w-4" />
      case 'maintenance':
        return <Settings className="h-4 w-4" />
      case 'unknown':
        return <FileText className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(log => log.action).filter(Boolean)))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            System Logs
          </h2>
          <p className="text-muted-foreground">
            Track all system activities and user actions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchLogs}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Export logs functionality (placeholder)
              console.log('Export logs', filteredLogs)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action ? action.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Logs</p>
                <p className="text-2xl font-bold">
                  {logs.filter(log => 
                    new Date(log.created_at).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Actions</p>
                <p className="text-2xl font-bold">{uniqueActions.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
              <Search className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/20 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                    {getActionIcon(log.action || 'unknown')}
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant={getActionBadgeColor(log.action || 'unknown') as any}
                      className="text-xs"
                    >
                      {(log.action || 'unknown').replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">{log.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      User: {log.user_id || 'System'}
                    </span>
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        +{Object.keys(log.metadata).length} metadata
                      </span>
                    )}
                  </div>
                  
                  {log.metadata && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">
                  {logs.length === 0 ? 'No logs yet' : 'No logs match your filters'}
                </h3>
                <p className="text-muted-foreground">
                  {logs.length === 0 
                    ? 'System activities will appear here as they occur.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}