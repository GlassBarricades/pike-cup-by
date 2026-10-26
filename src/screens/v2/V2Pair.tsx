import { Stack, Text, Title } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { formatTournamentDate } from '../../features/tournament/date'
import { useTeam, useTeamMembers } from '../../features/tournament/hooks'
import { useSeasonDigest } from '../../features/tournament/season'
import { formatPlace } from '../../features/tournament/scoring'
import { gramsLabel, pairStats, rivalsForNames } from '../../features/tournament/spectator'
import { slotTitle } from '../../features/tournament/schedule'
import { Panel } from '../../ui'
import { useMemo } from 'react'

export function V2Pair() {
  const { teamId } = useParams()
  const { data: team, isLoading } = useTeam(teamId)
  const { data: members = [] } = useTeamMembers(teamId)
  const { data: bundles = [], isLoading: seasonLoading } = useSeasonDigest()
  const names = useMemo(() => {
    const fromMembers = members.map((member) => member.athlete?.full_name).filter((name): name is string => Boolean(name))
    if (fromMembers.length >= 2) return fromMembers.slice(0, 2)
    const latest = bundles.flatMap((bundle) => bundle.entries).find((entry) => entry.team_id === teamId)
    return (latest?.roster ?? []).map((member) => member.full_name_snapshot).filter(Boolean).slice(0, 2)
  }, [members, bundles, teamId])
  const stats = useMemo(() => (names.length === 2 ? pairStats(bundles, names) : null), [bundles, names])
  const rivals = useMemo(() => (names.length === 2 ? rivalsForNames(bundles, names) : []), [bundles, names])

  if (isLoading) return <Text c="dimmed">Загрузка…</Text>
  if (!team) return <Text>Команда не найдена</Text>

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>{team.name}</Title>
        <Text size="sm" c="dimmed">
          {names.join(' · ') || 'Состав пары не собран'}
        </Text>
      </div>
      {seasonLoading ? (
        <Text c="dimmed">Считаем пару…</Text>
      ) : stats ? (
        <>
          <Panel p="sm">
            <Text size="sm">Старты вместе {stats.starts}</Text>
            <Text size="sm">Победы {stats.wins}</Text>
            <Text size="sm">Подиумы {stats.podiums}</Text>
            <Text size="sm">Зона A сильнее зоны B: {stats.zoneABetter} раз</Text>
            <Text size="sm">
              Лучший мини-тур: {stats.bestMini ? `${gramsLabel(stats.bestMini.grams)} · ${slotTitle(stats.bestMini)}` : '—'}
            </Text>
            <Text size="sm">
              Худший мини-тур: {stats.worstMini ? `${gramsLabel(stats.worstMini.grams)} · ${slotTitle(stats.worstMini)}` : '—'}
            </Text>
            <Text size="sm">Средний слот: {stats.averageMini == null ? '—' : gramsLabel(Math.round(stats.averageMini))}</Text>
          </Panel>
          <Stack gap="xs">
            {stats.history.map((row) => (
              <Panel key={row.entryId} p="sm">
                <Link to={`/live/t/${row.tournamentId}/team/${row.entryId}`} style={{ color: 'inherit', fontWeight: 700 }}>
                  {row.tournamentName}
                </Link>
                <Text size="sm" c="dimmed">
                  {formatTournamentDate(row.date)}
                  {row.finalPlace != null ? ` · место ${formatPlace(row.finalPlace)}` : ''}
                  {row.zoneAPlace != null ? ` · A ${formatPlace(row.zoneAPlace)} (${gramsLabel(row.zoneAWeight)})` : ''}
                  {row.zoneBPlace != null ? ` · B ${formatPlace(row.zoneBPlace)} (${gramsLabel(row.zoneBWeight)})` : ''}
                </Text>
              </Panel>
            ))}
          </Stack>
          <Panel p="sm">
            <Text fw={700}>Соперники в одной стартовой группе</Text>
            {rivals.length === 0 ? (
              <Text size="sm" c="dimmed">
                Общих групп пока нет
              </Text>
            ) : (
              rivals.slice(0, 8).map((rival) => (
                <Text key={rival.key} size="sm">
                  {rival.names.join(' · ')} · встреч {rival.meetings} · мы выше {rival.myBetter} · они выше {rival.theirBetter}
                  {rival.ties ? ` · ничьи ${rival.ties}` : ''}
                </Text>
              ))
            )}
          </Panel>
        </>
      ) : (
        <Text size="sm" c="dimmed">
          Для статистики пары нужны двое рыбаков в текущем составе или в снимке заявки.
        </Text>
      )}
    </Stack>
  )
}
