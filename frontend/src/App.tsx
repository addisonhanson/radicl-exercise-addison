import { useEffect } from 'react'
import { Header } from './components/Header'
import { ServiceStatus } from './components/ServiceStatus'
import { FetchedDataView } from './components/FetchedDataView'
import { DataVisualization } from './components/DataVisualization'
import { GettingStarted } from './components/GettingStarted'
import { useAppStore } from './store/useAppStore'
import './App.css'

function App() {
  const fetchHealthStatus = useAppStore((state) => state.fetchHealthStatus)

  useEffect(() => {
    fetchHealthStatus()
  }, [fetchHealthStatus])

  return (
    <div className="app">
      <Header />

      <main className="main">
        <ServiceStatus />
        <FetchedDataView />
        <DataVisualization />
        <GettingStarted />
      </main>
    </div>
  )
}

export default App
