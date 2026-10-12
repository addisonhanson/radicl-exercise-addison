import { createTheme } from '@mui/material/styles'
import { amber, orange, red } from '@mui/material/colors'

// Base dark theme for the security dashboard. Palette and component overrides
// will be fleshed out as the dashboard UI is built.
export const theme = createTheme({
  palette: {
    mode: 'dark',
  },
})

// Severity colors shared by every chart. Severity is ordered, so these form a
// red-to-amber ramp whose lightness rises steadily from Critical to Low; the
// order stays readable for colorblind viewers even where the hues blur.
export const severityColors = {
  critical: red[700],
  high: orange[700],
  medium: amber[600],
  low: amber[200],
} as const
