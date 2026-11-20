import { Anchor, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { useRefreshTournament } from '../../features/tournament/hooks'
import { slotTitle } from '../../features/tournament/schedule'
import { formatPlaceShift, gramsLabel } from '../../features/tournament/spectator'
import { useCheer } from '../../features/tournament/cheer'
import { EmptyState } from '../../ui'
import { useV2Tournament } from './context'

export function V2Feed() {
  const { tournament, story, catches, entries, miniTours, draws } = useV2Tournament()
  const cheer = useCheer(tournament.id)
  const { newCatchIds, hasRefreshed } = useRefreshTournament(tournament.id)
  const newIds = hasRefreshed && newCatchIds.length > 0 ? new Set(newCatchIds) : null

  if (!story) {
    const athleteById = new Map(
      entries.flatMap((e) => (e.roster ?? []).map((m) => [m.id, { name: m.full_name_snapshot, team: e.team_name_snapshot }])),
    )
    const miniById = new Map(miniTours.map((m) => [m.id, m]))
    const sorted = [...catches].sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (sorted.length === 0) {
      return <EmptyState title="Лента пустая" description="Строка появится с первым взвешиванием." />
    }
    return (
      <Stack gap={0}>
        {sorted.map((row) => {
          const athlete = row.roster_member_id ? athleteById.get(row.roster_member_id) : null
          const mini = miniById.get(row.mini_tour_id)
          const draw = draws.find(
            (d) =>
              d.roster_member_id === row.roster_member_id &&
              d.tour_number === mini?.tour_number &&
              d.mini_number === mini?.mini_number,
          )
          return (
            <Group
              key={row.id}
              justify="space-between"
              py="xs"
              style={{ borderBottom: '1px solid var(--pc-line)' }}
            >
              <div>
                <Text size="sm" fw={600}>
                  {athlete?.name ?? 'Спортсмен'} · {athlete?.team ?? ''}
                </Text>
                <Text size="xs" c="dimmed">
                  {mini ? slotTitle({ tour: mini.tour_number, mini: mini.mini_number }) : '—'}
                  {draw ? ` · ${draw.zone}/${draw.sector}` : ''}
                </Text>
              </div>
              <Text fw={700}>{row.weight_grams} г</Text>
            </Group>
          )
        })}
      </Stack>
    )
  }

  if (story.moments.length === 0) {
    return <EmptyState title="Лента пустая" description="Строка появится с первым взвешиванием." />
  }
  return (
    <Stack gap={0}>
      {story.moments.map((moment) => {
        const shift = formatPlaceShift(moment.zonePlaceBefore, moment.zonePlaceAfter)
        const sumShift = moment.sumBefore != null && moment.sumAfter != null ? formatPlaceShift(moment.sumBefore, moment.sumAfter) : null
        const sectorQuery = moment.zone && moment.sector != null ? `?zone=${moment.zone}&sector=${moment.sector}` : ''
        const mine = cheer.entryIds.includes(moment.entryId)
        const isNew = Boolean(newIds?.has(moment.id))
        return (
          <Group
            key={moment.id}
            justify="space-between"
            align="flex-start"
            wrap="nowrap"
            py="xs"
            style={{
              borderBottom: '1px solid var(--pc-line)',
              borderLeft: isNew ? '2px solid color-mix(in srgb, var(--pc-signal) 55%, transparent)' : undefined,
              paddingLeft: isNew ? 10 : undefined,
              background: isNew
                ? 'color-mix(in srgb, var(--pc-signal) 8%, transparent)'
                : mine
                  ? 'color-mix(in srgb, var(--pc-signal) 10%, transparent)'
                  : undefined,
            }}
          >
            <div>
              <Text size="sm">
                <Text span className="pc-tabular">
                  {formatCatchClock(moment.createdAt)}
                </Text>
                {moment.zone ? ` · зона ${moment.zone}` : ''}
                {moment.sector != null ? ` · сектор ${moment.sector}` : ''}
                {moment.tour && moment.mini ? ` · ${slotTitle({ tour: moment.tour, mini: moment.mini })}` : ''}
              </Text>
              <Anchor component={Link} to={`/live/t/${tournament.id}/team/${moment.entryId}`} fw={700} c="inherit" underline="never">
                {moment.athleteName ?? moment.teamName}
              </Anchor>
              {moment.athleteName ? (
                <Text size="sm" c="dimmed">
                  {moment.teamName}
                </Text>
              ) : null}
              <Text size="sm" c="dimmed">
                {shift ? `личное ${shift}` : ''}
                {shift && sumShift ? ' · ' : ''}
                {sumShift ? `команда ${sumShift}` : !shift ? '—' : ''}
              </Text>
              {sectorQuery ? (
                <Anchor component={Link} to={`/live/t/${tournament.id}/map${sectorQuery}`} size="xs" c="dimmed">
                  На карте
                </Anchor>
              ) : null}
            </div>
            <Text fw={700} className="pc-tabular" c={mine ? 'var(--pc-signal)' : undefined} style={{ flexShrink: 0 }}>
              {gramsLabel(moment.grams)}
            </Text>
          </Group>
        )
      })}
    </Stack>
  )
}
