import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DataItem } from '../types/api'
import './DataCharts.css'

// Type alias (not interface) so it satisfies Recharts' index-signature data type
type TypeCount = {
  type: string
  count: number
}

interface DataChartsProps {
  data: DataItem[]
}

const COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444']

export function DataCharts({ data }: DataChartsProps) {
  // Prepare data for type distribution
  const typeDistribution = data.reduce<TypeCount[]>((acc, item) => {
    const existing = acc.find(d => d.type === item.type)
    if (existing) {
      existing.count++
    } else {
      acc.push({ type: item.type, count: 1 })
    }
    return acc
  }, [])

  // Sample trend data (you would get this from your API in real scenario)
  const trendData = [
    { month: 'Jan', node: 4, go: 3, react: 2 },
    { month: 'Feb', node: 5, go: 4, react: 3 },
    { month: 'Mar', node: 6, go: 5, react: 4 },
    { month: 'Apr', node: 8, go: 6, react: 5 },
    { month: 'May', node: 10, go: 7, react: 6 },
    { month: 'Jun', node: 12, go: 9, react: 8 },
  ]

  return (
    <div className="charts-container">
      <div className="chart-card">
        <h3>Type Distribution (Pie Chart)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={typeDistribution}
              dataKey="count"
              nameKey="type"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ type, count }) => `${type}: ${count}`}
            >
              {typeDistribution.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Items by Type (Bar Chart)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={typeDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#667eea" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card full-width">
        <h3>Growth Trend (Line Chart)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="node"
              stroke="#10b981"
              strokeWidth={2}
              name="Node.js"
            />
            <Line
              type="monotone"
              dataKey="go"
              stroke="#00add8"
              strokeWidth={2}
              name="Go"
            />
            <Line
              type="monotone"
              dataKey="react"
              stroke="#61dafb"
              strokeWidth={2}
              name="React"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

