import { useState, type ComponentType } from 'react'
import { Box, Card, Tab, Tabs } from '@mui/material'
import { EventTimelineChart } from './charts/EventTimelineChart'

interface ChartTab {
  label: string
  Chart: ComponentType
}

// Each chart is a tab; add an entry here to add a chart. Only the selected
// tab is mounted, so hidden charts don't render or measure a zero width.
const tabs: ChartTab[] = [
  { label: 'Events Timeline', Chart: EventTimelineChart },
]

export function ChartTabs() {
  const [selected, setSelected] = useState(0)
  const { Chart } = tabs[selected]

  return (
    <Card variant="outlined">
      <Tabs
        value={selected}
        onChange={(_event, value: number) => setSelected(value)}
        sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.label} label={tab.label} sx={{ textTransform: 'none' }} />
        ))}
      </Tabs>
      <Box sx={{ p: 2 }}>
        <Chart />
      </Box>
    </Card>
  )
}
