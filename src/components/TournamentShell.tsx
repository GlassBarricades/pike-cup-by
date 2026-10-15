import type { ReactNode } from 'react'
import { Anchor, Badge, Group, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatTournamentDate, statusLabel } from '../features/tournament/date'
import type { Tournament } from '../features/tournament/types'
import { PageFrame } from './PageFrame'
import { TournamentTabs } from './ui'

export function tournamentTabs(tournamentId: string, isFinished: boolean) {
  const base = `/tournament/${tournamentId}`
  return [
    { to: base, label: 'Обзор', end: true },
    { to: `${base}/results`, label: isFinished ? 'Протокол' : 'Live' },
    { to: `${base}/schedule`, label: 'Расписание' },
    { to: `${base}/teams`, label: 'Команды' },
    { to: `${base}/rules`, label: 'Регламент' },
  ]
}

export function TournamentShell({
  tournament,
  children,
  wide,
  showBack = true,
}: {
  tournament: Tournament
  children: ReactNode
  wide?: boolean
  showBack?: boolean
}) {
  const isFinished = tournament.status === 'finished'

  return (
    <PageFrame wide={wide}>
      <Stack gap="md">
        {showBack && (
          <Anchor component={Link} to="/tournament" size="sm" c="dimmed">
            ← Все турниры
          </Anchor>
        )}
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <div>
            <Group gap="sm" wrap="wrap" mb={4}>
              <Title order={2}>{tournament.name}</Title>
              <Badge
                color={isFinished ? 'gray' : tournament.status === 'live' ? 'lure' : 'depth'}
                variant="filled"
              >
                {statusLabel[tournament.status]}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              {formatTournamentDate(tournament.event_date)} · {tournament.location}
            </Text>
          </div>
        </Group>
        <TournamentTabs tabs={tournamentTabs(tournament.id, isFinished)} />
        {children}
      </Stack>
    </PageFrame>
  )
}
