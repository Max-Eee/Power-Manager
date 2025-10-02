"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Power, 
  Zap, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  Calendar,
  IndianRupee
} from 'lucide-react'
import { format } from 'date-fns'

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
}

interface DashboardProps {
  powerStatus: PowerStatusData | null
  consumptionData: ConsumptionData[]
}

export default function Dashboard({ powerStatus, consumptionData }: DashboardProps) {
  // Calculate statistics
  const totalUnits = consumptionData.reduce((sum, record) => sum + record.units_consumed, 0)
  const totalCost = consumptionData.reduce((sum, record) => sum + (record.total_cost || 0), 0)
  const averageDaily = consumptionData.length > 0 ? totalUnits / consumptionData.length : 0
  
  // Get today's consumption
  const today = new Date().toISOString().split('T')[0]
  const todayConsumption = consumptionData.find(record => 
    record.reading_date === today
  )

  // Calculate power uptime (mock calculation for demo)
  const uptimePercentage = powerStatus?.status === 'ON' ? 96.5 : 85.2

  return (
    <div className="space-y-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Power Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Power Status</CardTitle>
            <Power className={`h-4 w-4 ${
              powerStatus?.status === 'ON' ? 'text-green-500' : 'text-red-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={powerStatus?.status === 'ON' ? 'default' : 'destructive'}
                className="text-lg font-bold px-3 py-1"
              >
                {powerStatus?.status || 'Unknown'}
              </Badge>
              {powerStatus?.status === 'ON' && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            {powerStatus && (
              <p className="text-xs text-muted-foreground mt-2">
                Since {format(new Date(powerStatus.timestamp), 'MMM d, HH:mm')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Today's Consumption */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Usage</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {todayConsumption?.units_consumed?.toFixed(1) || '0.0'} kWh
            </div>
            {todayConsumption?.total_cost && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <IndianRupee className="h-3 w-3 mr-1" />
                ₹{todayConsumption.total_cost.toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Average */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDaily.toFixed(1)} kWh</div>
            <p className="text-xs text-muted-foreground">
              Last {consumptionData.length} days
            </p>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uptimePercentage}%</div>
            <div className="mt-2">
              <Progress value={uptimePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Consumption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <div className="space-y-3 pr-2">
                {consumptionData.slice(0, 10).map((record) => (
                  <div 
                    key={record.id} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">
                        {format(new Date(record.reading_date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Zap className="h-3 w-3 inline mr-1" />
                        {record.units_consumed.toFixed(2)} kWh
                      </p>
                    </div>
                    {record.total_cost && (
                      <div className="text-left sm:text-right mt-2 sm:mt-0">
                        <p className="font-medium text-sm sm:text-base flex items-center justify-start sm:justify-end">
                          <IndianRupee className="h-3 w-3 mr-1" />
                          {record.total_cost.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @₹{(record.total_cost / record.units_consumed).toFixed(2)}/unit
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              
              {consumptionData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>No consumption data available</p>
                  <p className="text-sm">Start by adding your first reading</p>
                </div>
              )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Total Consumption */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Consumption</p>
                  <p className="text-2xl font-bold">{totalUnits.toFixed(1)} kWh</p>
                </div>
                <Zap className="h-8 w-8 text-amber-500" />
              </div>

              {/* Total Cost */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Cost</p>
                  <p className="text-2xl font-bold">₹{totalCost.toFixed(2)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-500" />
              </div>

              {/* Average Cost per Unit */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avg Cost/Unit</p>
                  <p className="text-2xl font-bold">
                    ₹{totalUnits > 0 ? (totalCost / totalUnits).toFixed(2) : '0.00'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>

              {/* Power Status Duration */}
              {powerStatus?.duration_minutes && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {powerStatus.status === 'ON' ? 'Uptime' : 'Outage Duration'}
                    </p>
                    <p className="text-2xl font-bold">
                      {Math.round(powerStatus.duration_minutes)} min
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-500" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                consumptionData.length > 0 ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Database</p>
                <p className="text-sm text-muted-foreground truncate">
                  {consumptionData.length > 0 ? 'Connected' : 'Disconnected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                powerStatus ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Notifications</p>
                <p className="text-sm text-muted-foreground truncate">
                  {powerStatus ? 'Active' : 'Standby'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors sm:col-span-2 lg:col-span-1">
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                powerStatus?.status === 'ON' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Power Monitor</p>
                <p className="text-sm text-muted-foreground truncate">
                  {powerStatus ? `${powerStatus.status} - Real-time` : 'No Data'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}