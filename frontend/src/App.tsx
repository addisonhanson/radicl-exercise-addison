import { useEffect } from 'react'
import { Box, Container } from '@mui/material'
import { Header } from './components/Header'
import { KpiGrid } from './components/KpiGrid'
import { ServiceStatus } from './components/ServiceStatus'
import { useAppStore } from './store/useAppStore'

function App() {
  const fetchHealthStatus = useAppStore((state) => state.fetchHealthStatus)
  const fetchSummary = useAppStore((state) => state.fetchSummary)

  useEffect(() => {
    fetchHealthStatus()
    fetchSummary()
  }, [fetchHealthStatus, fetchSummary])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Container maxWidth="xl" component="main" sx={{ py: 3, px: { xs: 2, md: 4 }, flexGrow: 1 }}>
        <KpiGrid />
      </Container>
      <Box component="footer" sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <ServiceStatus />
      </Box>
    </Box>
  )
}

export default App
