export function GettingStarted() {
  return (
    <section className="info-section">
      <h2>Getting Started</h2>
      <div className="info-content">
        <p>This application demonstrates a full-stack setup with:</p>
        <ul>
          <li>React.js frontend (Vite)</li>
          <li>Node.js backend service (Express)</li>
          <li>Go backend service (Gorilla Mux)</li>
          <li>PostgreSQL database (Docker)</li>
          <li>TanStack Table for data tables</li>
          <li>Recharts for data visualization</li>
        </ul>
        <p>Make sure all services are running:</p>
        <code>
          Database: docker-compose up -d<br/>
          Frontend: npm run dev (port 5173)<br/>
          Node.js: npm run dev (port 3001)<br/>
          Go: go run main.go (port 3002)
        </code>
        <p className="tip">
          💡 <strong>Tip:</strong> Click both "Fetch Node Data" and "Fetch Go Data" buttons 
          to see the interactive table and charts in action!
        </p>
      </div>
    </section>
  )
}

