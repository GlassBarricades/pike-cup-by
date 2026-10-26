import { Badge } from '@mantine/core'
import { statusLabel } from '../features/tournament/date'
import { competitionStageLabel, type CompetitionStage } from '../features/tournament/schedule'
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

const stageColor: Record<CompetitionStage, string> = {
  registration: 'gray',
  live: 'signal',
  completed: 'gray',
}

export function StageBadge({
  stage,
  size = 'sm',
}: {
  stage: CompetitionStage
  size?: 'xs' | 'sm' | 'md' | 'lg'
}) {
  return (
    <Badge color={stageColor[stage]} variant={stage === 'live' ? 'filled' : 'light'} size={size}>
      {competitionStageLabel[stage]}
    </Badge>
  )
}
