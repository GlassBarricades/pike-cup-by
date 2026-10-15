import { Badge } from '@mantine/core'
import { statusLabel } from '../features/tournament/date'
import type { TournamentStatus } from '../features/tournament/types'

const statusColor: Record<TournamentStatus, string> = {
  draft: 'gray',
  published: 'gray',
  live: 'signal',
  finished: 'gray',
}

export function StatusBadge({
  status,
  size = 'sm',
}: {
  status: TournamentStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
  return (
    <Badge color={statusColor[status]} variant={status === 'live' ? 'filled' : 'light'} size={size}>
      {statusLabel[status]}
    </Badge>
  )
}
