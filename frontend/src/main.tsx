import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from './App'
import { theme } from './theme/theme'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      {/* color-scheme: dark gives native scrollbars and form controls dark styling. */}
      <CssBaseline enableColorScheme />
      <App />
    </ThemeProvider>
  </StrictMode>,
)
