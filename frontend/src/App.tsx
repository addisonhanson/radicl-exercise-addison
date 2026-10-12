import { useEffect } from 'react'
import { Box, Container, Stack } from '@mui/material'
import { ChartTabs } from './components/ChartTabs'
import { Header } from './components/Header'
import { KpiGrid } from './components/KpiGrid'
import { ServiceStatus } from './components/ServiceStatus'
import { useAppStore } from './store/useAppStore'

function App() {
  const fetchHealthStatus = useAppStore((state) => state.fetchHealthStatus)
  const fetchSummary = useAppStore((state) => state.fetchSummary)
  const fetchTimeline = useAppStore((state) => state.fetchTimeline)
  const fetchOpenEvents = useAppStore((state) => state.fetchOpenEvents)
  const fetchAssetsAtRisk = useAppStore((state) => state.fetchAssetsAtRisk)
  const fetchThreatOrigins = useAppStore((state) => state.fetchThreatOrigins)

  useEffect(() => {
    fetchHealthStatus()
    fetchSummary()
    fetchTimeline()
    fetchOpenEvents()
    fetchAssetsAtRisk()
    fetchThreatOrigins()
  }, [fetchHealthStatus, fetchSummary, fetchTimeline, fetchOpenEvents, fetchAssetsAtRisk, fetchThreatOrigins])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Container maxWidth="xl" component="main" sx={{ py: 3, px: { xs: 2, md: 4 }, flexGrow: 1 }}>
        <Stack spacing={3}>
          <KpiGrid />
          <ChartTabs />
        </Stack>
      </Container>
      <Box component="footer" sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <ServiceStatus />
      </Box>
    </Box>
  )
}

export default App
