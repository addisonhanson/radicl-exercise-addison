import { useAppStore } from '../store/useAppStore'

export function ServiceStatus() {
  const { nodeHealth, goHealth, loading, fetchNodeData, fetchGoData } = useAppStore()

  return (
    <section className="status-section">
      <h2>Backend Services Status</h2>
      <div className="status-grid">
        <div className="status-card">
          <h3>Node.js Service</h3>
          {loading ? (
            <p>Loading...</p>
          ) : nodeHealth?.status ? (
            <>
              <p className="status healthy">✓ {nodeHealth.status}</p>
              <p className="service-name">{nodeHealth.service}</p>
              <p className="timestamp">{nodeHealth.timestamp}</p>
            </>
          ) : (
            <p className="status error">✗ Service unavailable</p>
          )}
          <button onClick={fetchNodeData} className="btn">
            Fetch Node Data
          </button>
        </div>

        <div className="status-card">
          <h3>Go Service</h3>
          {loading ? (
            <p>Loading...</p>
          ) : goHealth?.status ? (
            <>
              <p className="status healthy">✓ {goHealth.status}</p>
              <p className="service-name">{goHealth.service}</p>
              <p className="timestamp">{goHealth.timestamp}</p>
            </>
          ) : (
            <p className="status error">✗ Service unavailable</p>
          )}
          <button onClick={fetchGoData} className="btn">
            Fetch Go Data
          </button>
        </div>
      </div>
    </section>
  )
}

