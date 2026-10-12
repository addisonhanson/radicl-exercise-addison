import { useAppStore } from '../store/useAppStore'
import { DataCharts } from './DataCharts'
import { DataTable } from './DataTable'

export function DataVisualization() {
  const { allData, fetchAllData } = useAppStore()

  if (allData.length === 0) {
    return null
  }

  return (
    <>
      <section className="visualization-section">
        <div className="section-header">
          <h2>Data Visualization</h2>
          <button onClick={fetchAllData} className="btn btn-secondary">
            🔄 Refresh All Data
          </button>
        </div>
        <DataCharts data={allData} />
      </section>

      <section className="table-section">
        <h2>Interactive Data Table</h2>
        <p className="section-description">
          Click on column headers to sort. Powered by TanStack Table.
        </p>
        <DataTable data={allData} />
      </section>
    </>
  )
}

