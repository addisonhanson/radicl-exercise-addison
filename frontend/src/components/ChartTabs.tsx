import { useState, type ComponentType } from 'react'
import { Box, Card, Tab, Tabs } from '@mui/material'
import { AssetsAtRiskChart } from './charts/AssetsAtRiskChart'
import { EventTimelineChart } from './charts/EventTimelineChart'
import { OpenIncidentsChart } from './charts/OpenIncidentsChart'
import { ThreatMapChart } from './charts/ThreatMapChart'

// Fixed so switching tabs doesn't shift the page; charts stretch to fill it.
const PANEL_HEIGHT = 500

interface ChartTab {
  label: string
  Chart: ComponentType
}

// Each chart is a tab; add an entry here to add a chart. Only the selected
// tab is mounted, so hidden charts don't render or measure a zero width.
// Each chart's root should take flex: 1 to fill the fixed-height panel.
const tabs: ChartTab[] = [
  { label: 'Events Timeline', Chart: EventTimelineChart },
  { label: 'Open Incidents', Chart: OpenIncidentsChart },
  { label: 'Assets at Risk', Chart: AssetsAtRiskChart },
  { label: 'Threat Map', Chart: ThreatMapChart },
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
      {/* A flex column so each chart can take the full remaining height with flex: 1. */}
      <Box sx={{ p: 2, height: PANEL_HEIGHT, display: 'flex', flexDirection: 'column' }}>
        <Chart />
      </Box>
    </Card>
  )
}
