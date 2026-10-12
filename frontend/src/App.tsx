import { useEffect } from 'react'
import { Box, Container } from '@mui/material'
import { Header } from './components/Header'
import { ServiceStatus } from './components/ServiceStatus'
import { useAppStore } from './store/useAppStore'

function App() {
  const fetchHealthStatus = useAppStore((state) => state.fetchHealthStatus)

  useEffect(() => {
    fetchHealthStatus()
  }, [fetchHealthStatus])

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Header />
      <Container maxWidth="xl" component="main" sx={{ py: 3 }}>
        <ServiceStatus />
      </Container>
    </Box>
  )
}

export default App
