import { useMemo, useState } from 'react'
import { Anchor, Button, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { useRefreshTournament } from '../../features/tournament/hooks'
import { slotTitle } from '../../features/tournament/schedule'
import { formatPlaceShift, gramsLabel } from '../../features/tournament/spectator'
import { useCheer } from '../../features/tournament/cheer'
import type { ZoneCode } from '../../features/tournament/types'
import { EmptyState } from '../../ui'
import { useV2Tournament } from './context'

type ZoneFilter = 'all' | ZoneCode

function ZoneFilterBar({
  value,
  onChange,
}: {
  value: ZoneFilter
  onChange: (value: ZoneFilter) => void
}) {
  return (
    <Group gap={6} wrap="wrap" mb="xs">
      {(
        [
          ['all', 'Все'],
          ['A', 'A'],
          ['B', 'B'],
        ] as const
      ).map(([id, label]) => (
        <Button
          key={id}
          size="xs"
          variant={value === id ? 'filled' : 'default'}
          color={id === 'A' ? 'zoneA' : id === 'B' ? 'zoneB' : undefined}
          onClick={() => onChange(id)}
        >
          {label === 'Все' ? 'Все' : `Зона ${label}`}
        </Button>
      ))}
    </Group>
  )
}

export function V2Feed() {
  const { tournament, story, catches, entries, miniTours, draws } = useV2Tournament()
  const cheer = useCheer(tournament.id)
  const { newCatchIds, hasRefreshed } = useRefreshTournament(tournament.id)
  const newIds = hasRefreshed && newCatchIds.length > 0 ? new Set(newCatchIds) : null
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const zonesOnly = Boolean(tournament.draw_zones_only)

  const moments = useMemo(() => {
    if (!story) return []
    if (zoneFilter === 'all') return story.moments
    return story.moments.filter((moment) => moment.zone === zoneFilter)
  }, [story, zoneFilter])

  const fallbackRows = useMemo(() => {
    if (story) return []
    const athleteById = new Map(
      entries.flatMap((e) =>
        (e.roster ?? []).map((m) => [m.id, { name: m.full_name_snapshot, team: e.team_name_snapshot }]),
      ),
    )
    const miniById = new Map(miniTours.map((m) => [m.id, m]))
    const sorted = [...catches].sort((a, b) => b.created_at.localeCompare(a.created_at))
    return sorted.flatMap((row) => {
      const athlete = row.roster_member_id ? athleteById.get(row.roster_member_id) : null
      const mini = miniById.get(row.mini_tour_id)
      const draw = draws.find(
        (d) =>
          d.roster_member_id === row.roster_member_id &&
          d.tour_number === mini?.tour_number &&
          d.mini_number === mini?.mini_number,
      )
      if (zoneFilter !== 'all' && draw?.zone !== zoneFilter) return []
      return [{ row, athlete, mini, draw }]
    })
  }, [story, catches, entries, miniTours, draws, zoneFilter])

  if (!story) {
    if (catches.length === 0) {
      return <EmptyState title="Лента пустая" description="Строка появится с первым взвешиванием." />
    }
    return (
      <Stack gap="sm">
        <ZoneFilterBar value={zoneFilter} onChange={setZoneFilter} />
        {fallbackRows.length === 0 ? (
          <EmptyState title={zoneFilter === 'all' ? 'Лента пустая' : 'В этой зоне никого'} />
        ) : (
          <Stack gap={0}>
            {fallbackRows.map(({ row, athlete, mini, draw }) => (
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
                    {draw
                      ? zonesOnly
                        ? ` · зона ${draw.zone}`
                        : ` · ${draw.zone}/${draw.sector}`
                      : ''}
                  </Text>
                </div>
                <Text fw={700}>{row.weight_grams} г</Text>
              </Group>
            ))}
          </Stack>
        )}
      </Stack>
    )
  }

  if (story.moments.length === 0) {
    return <EmptyState title="Лента пустая" description="Строка появится с первым взвешиванием." />
  }

  return (
    <Stack gap="sm">
      <ZoneFilterBar value={zoneFilter} onChange={setZoneFilter} />
      {moments.length === 0 ? (
        <EmptyState title="В этой зоне никого" description="Смените зону или дождитесь взвешивания." />
      ) : (
        <Stack gap={0}>
          {moments.map((moment) => {
            const shift = formatPlaceShift(moment.zonePlaceBefore, moment.zonePlaceAfter)
            const sumShift =
              moment.sumBefore != null && moment.sumAfter != null
                ? formatPlaceShift(moment.sumBefore, moment.sumAfter)
                : null
            const sectorQuery =
              moment.zone && moment.sector != null && !zonesOnly
                ? `?zone=${moment.zone}&sector=${moment.sector}`
                : moment.zone
                  ? `?zone=${moment.zone}`
                  : ''
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
                  borderLeft: isNew
                    ? '2px solid color-mix(in srgb, var(--pc-signal) 55%, transparent)'
                    : undefined,
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
                    {moment.sector != null && !zonesOnly ? ` · сектор ${moment.sector}` : ''}
                    {moment.tour && moment.mini
                      ? ` · ${slotTitle({ tour: moment.tour, mini: moment.mini })}`
                      : ''}
                  </Text>
                  <Anchor
                    component={Link}
                    to={`/live/t/${tournament.id}/team/${moment.entryId}`}
                    fw={700}
                    c="inherit"
                    underline="never"
                  >
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
                    <Anchor
                      component={Link}
                      to={`/live/t/${tournament.id}/map${sectorQuery}`}
                      size="xs"
                      c="dimmed"
                    >
                      На карте
                    </Anchor>
                  ) : null}
                </div>
                <Text
                  fw={700}
                  className="pc-tabular"
                  c={mine ? 'var(--pc-signal)' : undefined}
                  style={{ flexShrink: 0 }}
                >
                  {gramsLabel(moment.grams)}
                </Text>
              </Group>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
