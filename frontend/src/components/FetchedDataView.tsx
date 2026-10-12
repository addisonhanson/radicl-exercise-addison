import { useAppStore } from '../store/useAppStore'

export function FetchedDataView() {
  const { nodeData, goData } = useAppStore()

  if (!nodeData && !goData) {
    return null
  }

  return (
    <section className="data-section">
      <h2>Fetched Data (Simple View)</h2>
      <div className="data-grid">
        {nodeData && (
          <div className="data-card">
            <h3>Node.js Data</h3>
            <ul>
              {nodeData.map(item => (
                <li key={item.id}>
                  {item.name} <span className="badge">{item.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {goData && (
          <div className="data-card">
            <h3>Go Data</h3>
            <ul>
              {goData.map(item => (
                <li key={item.id}>
                  {item.name} <span className="badge">{item.type}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

