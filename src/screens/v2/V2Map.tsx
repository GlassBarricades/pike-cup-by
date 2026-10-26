import { useMemo, useState } from 'react'
import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Link, useSearchParams } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { formatPlace } from '../../features/tournament/scoring'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel, sectorHistory, shoreLeaders, slipRoute, teamAtSector } from '../../features/tournament/spectator'
import type { ZoneCode } from '../../features/tournament/types'
import { LakeBoard, Panel } from '../../ui'
import { useV2Tournament } from './context'

type Pick = { zone: ZoneCode; sector: number }

export function V2Map() {
  const { tournament, entries, catches, miniTours, segments, story } = useV2Tournament()
  const [params] = useSearchParams()
  const queryZone = params.get('zone')
  const querySector = Number(params.get('sector'))
  const fromQuery: Pick | null = (queryZone === 'A' || queryZone === 'B') && querySector > 0 ? { zone: queryZone, sector: querySector } : null
  const [picked, setPicked] = useState<Pick | null>(fromQuery)
  const [camera, setCamera] = useState<'latest' | 'cheer'>('latest')
  const [heatMode, setHeatMode] = useState<'slot' | 'day'>('slot')
  const [board, setBoard] = useState(false)
  const [shores, setShores] = useState(false)
  const slipId = params.get('slip')
  const [routeId, setRouteId] = useState<string | null>(slipId)
  const slot = story.clock ?? story.closedWindow?.slot ?? null
  const slotIndex = slot ? story.slots.findIndex((item) => item.tour === slot.tour && item.mini === slot.mini) : -1
  const heat = heatMode === 'day' ? story.heatDay : slotIndex >= 0 ? story.heatBySlot[slotIndex] : []
  const routeEntry = entries.find((entry) => entry.id === routeId) ?? null
  const routePoints = routeEntry ? slipRoute(routeEntry, 'both') : undefined
  const focus = picked
  const standingEntry = slot && picked ? teamAtSector(entries, slot, picked.zone, picked.sector) : null
  const standing = standingEntry ? story.standings.find((row) => row.entryId === standingEntry.id) : null
  const history = useMemo(
    () => (picked ? sectorHistory(entries, catches, miniTours, story.slots, picked.zone, picked.sector) : []),
    [picked, entries, catches, miniTours, story.slots],
  )
  const tour = slot?.tour ?? 1
  const ticker = story.moments.slice(0, 12)

  return (
    <Stack gap="sm">
      <Group gap={6} wrap="wrap">
        <Button size="xs" variant={heatMode === 'slot' ? 'filled' : 'default'} onClick={() => setHeatMode('slot')}>
          Тепло окна
        </Button>
        <Button size="xs" variant={heatMode === 'day' ? 'filled' : 'default'} onClick={() => setHeatMode('day')}>
          Тепло дня
        </Button>
        <Button size="xs" variant={board ? 'filled' : 'default'} onClick={() => setBoard((value) => !value)}>
          {board ? 'Обычная карта' : 'Табло'}
        </Button>
        <Button size="xs" variant={shores ? 'filled' : 'default'} onClick={() => setShores((value) => !value)}>
          Два берега
        </Button>
        {routeEntry ? (
          <Button size="xs" variant="light" color="signal" onClick={() => setRouteId(null)}>
            Скрыть бумажку
          </Button>
        ) : null}
      </Group>
      <div style={board ? { display: 'flex', flexDirection: 'column', minHeight: '100dvh' } : undefined}>
        <div style={board ? { flex: '1 1 70%', minHeight: '70dvh' } : undefined}>
          <LakeBoard
            tournament={tournament}
            segments={segments}
            entries={entries}
            catches={catches}
            miniTours={miniTours}
            followCatches
            cameraFollow={camera}
            onCameraFollowChange={setCamera}
            heat={heat}
            onSector={(zone, sector) => setPicked({ zone, sector })}
            routePoints={routePoints}
            pulseSectors={story.pulse}
            focusSector={focus}
          />
        </div>
        {board ? (
          <Stack gap={6} mt="sm">
            <Text size="sm" className="pc-tabular">
              {ticker.map((moment) => `${formatCatchClock(moment.createdAt)} ${moment.teamName} ${gramsLabel(moment.grams)}`).join('   ·   ')}
            </Text>
            <Group gap="xs">
              {shoreLeaders(story.standings, tour, 'A').map((row) => (
                <Text key={row.entryId} size="sm">
                  A {formatPlace(row.zoneAPlace)}. {row.teamName}
                </Text>
              ))}
              {shoreLeaders(story.standings, tour, 'B').map((row) => (
                <Text key={row.entryId} size="sm">
                  B {formatPlace(row.zoneBPlace)}. {row.teamName}
                </Text>
              ))}
            </Group>
          </Stack>
        ) : null}
      </div>

      {picked ? (
        <Panel p="sm">
          <Text fw={700}>
            Зона {picked.zone} · сектор {picked.sector}
            {slot ? ` · ${slotTitle(slot)}` : ''}
          </Text>
          {standingEntry && standing ? (
            <Stack gap={4} mt={6}>
              <Link to={`/live/t/${tournament.id}/team/${standingEntry.id}`} style={{ fontWeight: 700, color: 'inherit' }}>
                {standing.teamName}
              </Link>
              <Text size="sm">
                Место в группе {formatPlace(picked.zone === 'B' ? standing.zoneBPlace : standing.zoneAPlace)} · вес зоны{' '}
                {gramsLabel(picked.zone === 'B' ? standing.zoneBWeight : standing.zoneAWeight)}
              </Text>
              <Button size="xs" variant="light" w="fit-content" onClick={() => setRouteId(standingEntry.id)}>
                Маршрут бумажки
              </Button>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" mt={6}>
              В этом окне на секторе никого нет
            </Text>
          )}
          <Stack gap={2} mt="sm">
            {history.map((row) => (
              <Text key={`${row.tour}-${row.mini}`} size="sm">
                {slotTitle({ tour: row.tour, mini: row.mini })} · {row.teamName} · {row.grams == null ? 'ещё не взвешена' : gramsLabel(row.grams)}
              </Text>
            ))}
          </Stack>
        </Panel>
      ) : (
        <Text size="sm" c="dimmed">
          Нажмите сектор: кто стоит по бумажке, вес окна и кто брал этот номер раньше.
        </Text>
      )}

      {shores ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {(['A', 'B'] as const).map((zone) => (
            <Panel key={zone} p="sm">
              <Text fw={700}>Зона {zone}</Text>
              {shoreLeaders(story.standings, tour, zone).concat(
                story.standings
                  .filter((row) => {
                    const entry = entries.find((item) => item.id === row.entryId)
                    const start = entry?.start_zone ?? entry?.draw_slip?.start_zone ?? null
                    return start != null && (tour === 1 ? start === zone : start !== zone)
                  })
                  .filter((row) => !shoreLeaders(story.standings, tour, zone).some((leader) => leader.entryId === row.entryId)),
              ).map((row) => (
                <Group key={row.entryId} justify="space-between">
                  <Link to={`/live/t/${tournament.id}/team/${row.entryId}`} style={{ color: 'inherit' }}>
                    {row.teamName}
                  </Link>
                  <Text size="sm" className="pc-tabular">
                    {formatPlace(zone === 'B' ? row.zoneBPlace : row.zoneAPlace)} · {gramsLabel(zone === 'B' ? row.zoneBWeight : row.zoneAWeight)}
                  </Text>
                </Group>
              ))}
            </Panel>
          ))}
        </SimpleGrid>
      ) : null}
      {shores ? (
        <Text size="sm" c="dimmed" className="pc-tabular">
          {ticker.map((moment) => `${formatCatchClock(moment.createdAt)} ${moment.teamName} ${gramsLabel(moment.grams)}`).join(' · ')}
        </Text>
      ) : null}
    </Stack>
  )
}
