import { AppBar, Toolbar, Typography } from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'

export function Header() {
  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <ShieldIcon color="primary" sx={{ mr: 1.5 }} />
        <Typography variant="h6" component="h1">
          RADICL Security Operations
        </Typography>
      </Toolbar>
    </AppBar>
  )
}
