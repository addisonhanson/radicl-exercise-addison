import { Box, Stack } from '@mui/material'
import { severityColors } from '../../theme/theme'
import type { Severity } from '../../types/api'

// A severity name with its color as a small dot, so color is never the only cue.
export function SeverityLabel({ severity }: { severity: Severity }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          flexShrink: 0,
          bgcolor: severityColors[severity.toLowerCase() as Lowercase<Severity>],
        }}
      />
      <span>{severity}</span>
    </Stack>
  )
}
