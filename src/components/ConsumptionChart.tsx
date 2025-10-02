"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { 
  Plus, 
  Zap, 
  IndianRupee, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ConsumptionData {
  id: string
  reading_date: string
  units_consumed: number
  total_cost: number | null
  cost_per_unit: number
}

interface ConsumptionChartProps {
  data: ConsumptionData[]
  onDataChange: () => void
}

export default function ConsumptionChart({ data, onDataChange }: ConsumptionChartProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    reading_date: new Date().toISOString().split('T')[0],
    units_consumed: '',
    cost_per_unit: '4.50'
  })

  // Prepare chart data
  const chartData = data.map(record => ({
    date: format(new Date(record.reading_date), 'MMM d'),
    units: record.units_consumed,
    cost: record.total_cost || 0,
    costPerUnit: record.cost_per_unit
  })).reverse() // Reverse to show chronological order

  // Calculate trends
  const totalUnits = data.reduce((sum, record) => sum + record.units_consumed, 0)
  const totalCost = data.reduce((sum, record) => sum + (record.total_cost || 0), 0)
  const averageDaily = data.length > 0 ? totalUnits / data.length : 0
  const averageCost = totalUnits > 0 ? totalCost / totalUnits : 0

  // Calculate trend (compare last 3 days vs previous 3 days)
  const recentData = data.slice(0, 3)
  const previousData = data.slice(3, 6)
  const recentAvg = recentData.length > 0 
    ? recentData.reduce((sum, r) => sum + r.units_consumed, 0) / recentData.length 
    : 0
  const previousAvg = previousData.length > 0 
    ? previousData.reduce((sum, r) => sum + r.units_consumed, 0) / previousData.length 
    : 0
  const trend = recentAvg - previousAvg

  const addConsumptionRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      const { isSupabaseAvailable, getSupabaseClient } = await import('@/lib/supabase')
      if (!isSupabaseAvailable()) {
        toast.error('Database not configured. Please check your Supabase settings.')
        return
      }

      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('power_consumption')
        .insert({
          reading_date: formData.reading_date,
          units_consumed: parseFloat(formData.units_consumed),
          cost_per_unit: parseFloat(formData.cost_per_unit)
        })

      if (error) {
        throw error
      }

      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          action: 'CONSUMPTION_RECORD_ADDED',
          description: `Added consumption record for ${formData.reading_date}`,
          metadata: {
            units_consumed: parseFloat(formData.units_consumed),
            cost_per_unit: parseFloat(formData.cost_per_unit)
          }
        })

      toast.success('Consumption record added successfully')
      setFormData({
        reading_date: new Date().toISOString().split('T')[0],
        units_consumed: '',
        cost_per_unit: '4.50'
      })
      setShowAddForm(false)
      onDataChange()
      
    } catch (error) {
      console.error('Error adding consumption record:', error)
      toast.error('Failed to add consumption record')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{totalUnits.toFixed(1)} kWh</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">₹{totalCost.toFixed(2)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold">{averageDaily.toFixed(1)} kWh</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trend</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">
                    {Math.abs(trend).toFixed(1)} kWh
                  </span>
                  {trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : trend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : null}
                </div>
              </div>
              <Badge variant={trend > 0 ? 'destructive' : trend < 0 ? 'default' : 'secondary'}>
                {trend > 0 ? 'Increasing' : trend < 0 ? 'Decreasing' : 'Stable'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Record */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Consumption Records</CardTitle>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Record
          </Button>
        </CardHeader>
        <CardContent>
          {showAddForm && (
            <form onSubmit={addConsumptionRecord} className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reading_date">Date</Label>
                  <Input
                    id="reading_date"
                    type="date"
                    value={formData.reading_date}
                    onChange={(e) => setFormData({ ...formData, reading_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="units_consumed">Units Consumed (kWh)</Label>
                  <Input
                    id="units_consumed"
                    type="number"
                    step="0.1"
                    placeholder="25.5"
                    value={formData.units_consumed}
                    onChange={(e) => setFormData({ ...formData, units_consumed: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cost_per_unit">Cost per Unit (₹)</Label>
                  <Input
                    id="cost_per_unit"
                    type="number"
                    step="0.01"
                    placeholder="4.50"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? 'Adding...' : 'Add Record'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units Consumption Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Daily Consumption (kWh)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value} ${name === 'units' ? 'kWh' : '₹'}`,
                      name === 'units' ? 'Consumption' : 'Cost'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="units" fill="#f59e0b" name="units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5" />
              Daily Cost (₹)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Cost']}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                    name="Daily Cost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 10).map((record) => (
              <div 
                key={record.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(record.reading_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {record.units_consumed} kWh
                    </span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      ₹{record.cost_per_unit}/unit
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xl font-bold">₹{record.total_cost?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-muted-foreground">
                    ₹{((record.total_cost || 0) / record.units_consumed).toFixed(2)}/kWh avg
                  </p>
                </div>
              </div>
            ))}
            
            {data.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No consumption data</p>
                <p>Add your first reading to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}