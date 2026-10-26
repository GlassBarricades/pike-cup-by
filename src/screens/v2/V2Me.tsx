import { Button, Select, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAthletesCatalog, useTeamsCatalog } from '../../features/tournament/hooks'
import { useSeasonDigest } from '../../features/tournament/season'
import { formatPlace } from '../../features/tournament/scoring'
import { athleteSeason } from '../../features/tournament/spectator'
import { setFollowAthlete, toggleFollowTeam, useV2Follow } from '../../features/tournament/v2Store'
import { formatTournamentDate } from '../../features/tournament/date'
import { Panel } from '../../ui'
import { useMemo } from 'react'

export function V2Me() {
  const follow = useV2Follow()
  const { data: teams = [] } = useTeamsCatalog()
  const { data: athletes = [] } = useAthletesCatalog()
  const { data: bundles = [], isLoading } = useSeasonDigest()
  const athlete = useMemo(() => (follow.athleteId ? athleteSeason(bundles, follow.athleteId) : null), [bundles, follow.athleteId])

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Список хранится только на этом устройстве. Камера «моя команда» на карте по-прежнему смотрит на одну команду, отмеченную «болею».
      </Text>
      <Select
        label="Добавить команду"
        placeholder="Название"
        searchable
        data={teams.map((team) => ({ value: team.id, label: team.name }))}
        value={null}
        onChange={(value) => {
          if (value && !follow.teamIds.includes(value)) toggleFollowTeam(value)
        }}
      />
      <Select
        label="Это мой рыбак"
        placeholder="Имя"
        searchable
        clearable
        data={athletes.map((athleteRow) => ({ value: athleteRow.id, label: athleteRow.full_name }))}
        value={follow.athleteId}
        onChange={(value) => setFollowAthlete(value)}
      />
      {follow.teamIds.length === 0 ? (
        <Text size="sm" c="dimmed">
          Команд в «моих» пока нет
        </Text>
      ) : (
        follow.teamIds.map((teamId) => {
          const team = teams.find((item) => item.id === teamId)
          const hits = bundles.flatMap((bundle) =>
            bundle.entries
              .filter((entry) => entry.team_id === teamId)
              .map((entry) => ({
                bundle,
                standing: bundle.standings.find((row) => row.entryId === entry.id) ?? null,
              })),
          )
          const latest = hits[0]
          return (
            <Panel key={teamId} p="sm">
              <Text fw={700}>{team?.name ?? 'Команда'}</Text>
              {isLoading ? (
                <Text size="sm" c="dimmed">
                  Считаем старты…
                </Text>
              ) : latest ? (
                <Text size="sm">
                  <Link to={`/live/t/${latest.bundle.tournament.id}`} style={{ color: 'inherit' }}>
                    {latest.bundle.tournament.name}
                  </Link>
                  {' · '}
                  {formatTournamentDate(latest.bundle.tournament.event_date)}
                  {latest.standing ? ` · место ${formatPlace(latest.standing.finalPlace)}, сумма ${formatPlace(latest.standing.placeSum)}` : ''}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  Стартов в опубликованных турнирах нет
                </Text>
              )}
              <Button size="xs" variant="subtle" color="gray" mt={6} onClick={() => toggleFollowTeam(teamId)}>
                Убрать
              </Button>
            </Panel>
          )
        })
      )}
      {athlete && follow.athleteId ? (
        <Panel p="sm">
          <Text fw={700}>
            <Link to={`/live/athletes/${follow.athleteId}`} style={{ color: 'inherit' }}>
              Мои старты
            </Link>
          </Text>
          <Text size="sm">
            {athlete.starts.length} стартов · подиумы {athlete.podiums}
          </Text>
          {athlete.starts.slice(0, 3).map((start) => (
            <Text key={start.entryId} size="sm">
              {start.tournamentName} · {start.teamName}
              {start.finalPlace != null ? ` · ${formatPlace(start.finalPlace)}` : ''}
            </Text>
          ))}
        </Panel>
      ) : null}
    </Stack>
  )
}
