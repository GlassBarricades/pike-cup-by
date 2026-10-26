import { Stack, Text, Title } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { formatTournamentDate } from '../../features/tournament/date'
import { useAthlete, useAthletesCatalog } from '../../features/tournament/hooks'
import { useSeasonDigest } from '../../features/tournament/season'
import { formatPlace } from '../../features/tournament/scoring'
import { athleteSeason, gramsLabel } from '../../features/tournament/spectator'
import { slotTitle } from '../../features/tournament/schedule'
import { Panel } from '../../ui'
import { useMemo } from 'react'

export function V2Athlete() {
  const { athleteId } = useParams()
  const { data: athlete, isLoading } = useAthlete(athleteId)
  const { data: catalog = [] } = useAthletesCatalog()
  const { data: bundles = [], isLoading: seasonLoading } = useSeasonDigest()
  const season = useMemo(() => (athleteId ? athleteSeason(bundles, athleteId) : null), [bundles, athleteId])
  const withTeam = catalog.find((item) => item.id === athleteId)

  if (isLoading) return <Text c="dimmed">Загрузка…</Text>
  if (!athlete || !athleteId) return <Text>Рыбак не найден</Text>

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>{athlete.full_name}</Title>
        {withTeam?.current_team_name && withTeam.current_team_id ? (
          <Text size="sm">
            Сейчас в{' '}
            <Link to={`/live/teams/${withTeam.current_team_id}`} style={{ color: 'inherit' }}>
              {withTeam.current_team_name}
            </Link>
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            Сейчас без команды
          </Text>
        )}
      </div>
      {seasonLoading || !season ? (
        <Text c="dimmed">Считаем сезон…</Text>
      ) : (
        <>
          <Panel p="sm">
            <Text size="sm">Старты {season.starts.length}</Text>
            <Text size="sm">Подиумы {season.podiums}</Text>
            <Text size="sm">Победы {season.wins}</Text>
            <Text size="sm">Команды: {season.teams.join(', ') || '—'}</Text>
            <Text size="sm">
              Лучший мини-тур:{' '}
              {season.bestMini ? `${gramsLabel(season.bestMini.grams)} · ${season.bestMini.tournamentName} · ${slotTitle(season.bestMini)}` : '—'}
            </Text>
            <Text size="sm">Средний вес слота: {season.averageMini == null ? '—' : gramsLabel(Math.round(season.averageMini))}</Text>
          </Panel>
          <Stack gap="xs">
            {season.starts.map((start) => (
              <Panel key={start.entryId} p="sm">
                <Link to={`/live/t/${start.tournamentId}/team/${start.entryId}`} style={{ color: 'inherit', fontWeight: 700 }}>
                  {start.tournamentName}
                </Link>
                <Text size="sm" c="dimmed">
                  {formatTournamentDate(start.date)} · {start.teamName}
                  {start.finalPlace != null ? ` · место ${formatPlace(start.finalPlace)}` : ''}
                  {start.placeSum != null ? ` · сумма ${formatPlace(start.placeSum)}` : ''}
                </Text>
              </Panel>
            ))}
          </Stack>
        </>
      )}
    </Stack>
  )
}
