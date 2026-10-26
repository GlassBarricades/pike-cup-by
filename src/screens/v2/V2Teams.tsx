import { useMemo, useState } from 'react'
import { Anchor, Button, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { writeCheer, readCheer } from '../../features/tournament/cheer'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone, slotTitle } from '../../features/tournament/schedule'
import { slipSector } from '../../features/tournament/slips'
import { gramsLabel } from '../../features/tournament/spectator'
import { toggleFollowTeam, useV2Follow } from '../../features/tournament/v2Store'
import { EmptyState } from '../../ui'
import { useV2Tournament } from './context'

export function V2Teams() {
  const { tournament, entries, story } = useV2Tournament()
  const follow = useV2Follow()
  const [alpha, setAlpha] = useState(false)
  const [cheerId, setCheerId] = useState(() => readCheer(tournament.id))
  const slot = story.clock
  const rows = useMemo(() => {
    const list = story.standings.map((row) => {
      const entry = entries.find((item) => item.id === row.entryId)
      const zone = entry && slot ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, slot.tour) : null
      const sector = entry && slot ? slipSector(entry.draw_slip, slot.tour, slot.mini) : null
      const cell = slot ? story.matrix.find((item) => item.entryId === row.entryId)?.cells[story.slots.findIndex((item) => item.tour === slot.tour && item.mini === slot.mini)] : null
      return { row, entry, zone, sector, miniGrams: cell?.grams ?? null }
    })
    list.sort((a, b) => {
      if (alpha) return a.row.teamName.localeCompare(b.row.teamName, 'ru')
      return a.row.finalPlace - b.row.finalPlace
    })
    return list
  }, [story, entries, slot, alpha])

  if (rows.length === 0) return <EmptyState title="Заявок нет" />

  return (
    <Stack gap="sm">
      <Group gap={6}>
        <Button size="xs" variant={alpha ? 'default' : 'filled'} onClick={() => setAlpha(false)}>
          По месту
        </Button>
        <Button size="xs" variant={alpha ? 'filled' : 'default'} onClick={() => setAlpha(true)}>
          По алфавиту
        </Button>
      </Group>
      {rows.map(({ row, entry, zone, sector, miniGrams }) => (
        <Group key={row.entryId} justify="space-between" align="flex-start" wrap="nowrap" py={6} style={{ borderBottom: '1px solid var(--pc-line)' }}>
          <div>
            <Anchor component={Link} to={`/live/t/${tournament.id}/team/${row.entryId}`} fw={700} c="inherit" underline="never">
              {formatPlace(row.finalPlace)}. {row.teamName}
            </Anchor>
            <Text size="xs" c="dimmed">
              Сумма {formatPlace(row.placeSum)}
              {slot ? ` · ${slotTitle(slot)} ` : ' '}
              {miniGrams == null ? 'ещё не взвешена' : gramsLabel(miniGrams)}
              {zone ? ` · зона ${zone}` : ''}
              {sector != null ? ` · сектор ${sector}` : ''}
            </Text>
            <Group gap={6} mt={4}>
              {entry?.team_id ? (
                <Button size="compact-xs" variant={follow.teamIds.includes(entry.team_id) ? 'filled' : 'default'} color="signal" onClick={() => toggleFollowTeam(entry.team_id!)}>
                  {follow.teamIds.includes(entry.team_id) ? 'В моих' : 'В мои'}
                </Button>
              ) : null}
              <Button
                size="compact-xs"
                variant={cheerId === row.entryId ? 'filled' : 'light'}
                color={cheerId === row.entryId ? 'signal' : undefined}
                onClick={() => {
                  writeCheer(tournament.id, row.entryId)
                  setCheerId(row.entryId)
                }}
              >
                {cheerId === row.entryId ? 'Болею' : 'Болею за них'}
              </Button>
            </Group>
          </div>
          <Text className="pc-tabular" fw={700}>
            {gramsLabel(row.totalWeight)}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}
