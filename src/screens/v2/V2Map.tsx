import { useMemo, useState } from 'react'
import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Link, useSearchParams } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { defaultMapMode, getFormat, isAthleteCatch } from '../../features/tournament/formats'
import {
  athleteGramsForSlot,
  listAthletesOnZone,
} from '../../features/tournament/formats/individual/race'
import { formatPlace } from '../../features/tournament/scoring'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel, sectorHistory, shoreLeaders, slipRoute, teamAtSector } from '../../features/tournament/spectator'
import type { Tournament, ZoneCode } from '../../features/tournament/types'
import { EmptyState, LakeBoard, Panel, VenueMapView } from '../../ui'
import { useV2Tournament } from './context'

type Pick = { zone: ZoneCode; sector: number }

export function V2Map() {
  const { tournament, entries, catches, miniTours, segments, story } = useV2Tournament()
  const format = getFormat(tournament)
  const useGeo =
    isAthleteCatch(format) ||
    tournament.map_mode === 'geo' ||
    defaultMapMode(format) === 'geo'

  if (useGeo) {
    return <V2GeoMap />
  }

  return (
    <V2SchematicMap
      tournament={tournament}
      entries={entries}
      catches={catches}
      miniTours={miniTours}
      segments={segments}
      story={story}
    />
  )
}

function V2GeoMap() {
  const { tournament, entries, catches, miniTours, story, draws } = useV2Tournament()
  const [zoneFilter, setZoneFilter] = useState<ZoneCode | 'all'>('all')
  const slot = story.clock ?? story.closedWindow?.slot ?? null
  const zonesOnly = Boolean(tournament.draw_zones_only)

  const roster = useMemo(() => {
    if (!slot) return []
    const zones: ZoneCode[] = zoneFilter === 'all' ? ['A', 'B'] : [zoneFilter]
    return zones.flatMap((zone) =>
      listAthletesOnZone(entries, draws, slot, zone).map((row) => ({
        ...row,
        zone,
        grams: athleteGramsForSlot(row.memberId, slot, catches, miniTours),
      })),
    )
  }, [slot, zoneFilter, entries, draws, catches, miniTours])

  const bySector = useMemo(() => {
    const map = new Map<string, typeof roster>()
    for (const row of roster) {
      const key = zonesOnly ? row.zone : `${row.zone}:${row.sector}`
      const list = map.get(key) ?? []
      list.push(row)
      map.set(key, list)
    }
    return [...map.entries()]
      .map(([key, rows]) => {
        const zone = (zonesOnly ? key : key.split(':')[0]) as ZoneCode
        const sector = zonesOnly ? 1 : Number(key.split(':')[1])
        const weighed = rows.filter((r) => r.grams != null)
        const leader = weighed.sort((a, b) => (b.grams ?? 0) - (a.grams ?? 0))[0]
        return {
          zone,
          sector,
          rows: rows.sort((a, b) =>
            zonesOnly
              ? a.name.localeCompare(b.name, 'ru')
              : a.sector - b.sector || a.name.localeCompare(b.name, 'ru'),
          ),
          leader,
        }
      })
      .sort((a, b) => a.zone.localeCompare(b.zone) || a.sector - b.sector)
  }, [roster, zonesOnly])

  if (!tournament.venue_map) {
    return (
      <EmptyState
        title="Карта площадки не задана"
        description="Организатор может загрузить схему во вкладке «Турнир → Карта площадки»."
      />
    )
  }

  return (
    <Stack gap="sm">
      <VenueMapView venueMap={tournament.venue_map} height={360} />
      <Group gap={6} wrap="wrap">
        <Button
          size="xs"
          variant={zoneFilter === 'all' ? 'filled' : 'default'}
          onClick={() => setZoneFilter('all')}
        >
          Все
        </Button>
        <Button
          size="xs"
          variant={zoneFilter === 'A' ? 'filled' : 'default'}
          color="zoneA"
          onClick={() => setZoneFilter('A')}
        >
          Зона A
        </Button>
        <Button
          size="xs"
          variant={zoneFilter === 'B' ? 'filled' : 'default'}
          color="zoneB"
          onClick={() => setZoneFilter('B')}
        >
          Зона B
        </Button>
      </Group>
      <Text size="sm" c="dimmed">
        {slot ? `Сейчас: ${slotTitle(slot)}` : 'Нет активного окна ловли'}
        {story.progress
          ? ` · взвешено ${story.progress.weighed}/${story.progress.expected}`
          : ''}
      </Text>
      {bySector.length === 0 ? (
        <Text size="sm" c="dimmed">
          В этом окне на карте никого нет по жеребьёвке.
        </Text>
      ) : (
        <Stack gap="xs">
          {bySector.map((block) => (
            <Panel key={zonesOnly ? block.zone : `${block.zone}-${block.sector}`} p="sm">
              <Group justify="space-between" align="flex-start">
                <Text fw={700}>
                  {zonesOnly ? `Зона ${block.zone}` : `Зона ${block.zone} · сектор ${block.sector}`}
                </Text>
                {block.leader?.grams != null ? (
                  <Text size="sm" className="pc-tabular" c="var(--pc-signal)">
                    лидер {gramsLabel(block.leader.grams)}
                  </Text>
                ) : null}
              </Group>
              <Stack gap={4} mt={6}>
                {block.rows.map((row) => (
                  <Group key={row.memberId} justify="space-between" wrap="nowrap">
                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={`/live/t/${tournament.id}/team/${row.entry.id}`}
                        style={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
                      >
                        {row.name}
                      </Link>
                      <Text size="xs" c="dimmed">
                        {row.entry.team_name_snapshot || 'личный'}
                      </Text>
                    </div>
                    <Text size="sm" fw={700} className="pc-tabular">
                      {row.grams == null ? '—' : gramsLabel(row.grams)}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Panel>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

function V2SchematicMap({
  tournament,
  entries,
  catches,
  miniTours,
  segments,
  story,
}: {
  tournament: Tournament
  entries: ReturnType<typeof useV2Tournament>['entries']
  catches: ReturnType<typeof useV2Tournament>['catches']
  miniTours: ReturnType<typeof useV2Tournament>['miniTours']
  segments: ReturnType<typeof useV2Tournament>['segments']
  story: ReturnType<typeof useV2Tournament>['story']
}) {
  const [params] = useSearchParams()
  const queryZone = params.get('zone')
  const querySector = Number(params.get('sector'))
  const fromQuery: Pick | null =
    (queryZone === 'A' || queryZone === 'B') && querySector > 0
      ? { zone: queryZone, sector: querySector }
      : null
  const [picked, setPicked] = useState<Pick | null>(fromQuery)
  const [camera, setCamera] = useState<'latest' | 'cheer'>('latest')
  const [heatMode, setHeatMode] = useState<'slot' | 'day'>('slot')
  const [board, setBoard] = useState(false)
  const [shores, setShores] = useState(false)
  const slipId = params.get('slip')
  const [routeId, setRouteId] = useState<string | null>(slipId)
  const slot = story.clock ?? story.closedWindow?.slot ?? null
  const slotIndex = slot
    ? story.slots.findIndex((item) => item.tour === slot.tour && item.mini === slot.mini)
    : -1
  const heat = heatMode === 'day' ? story.heatDay : slotIndex >= 0 ? story.heatBySlot[slotIndex] : []
  const routeEntry = entries.find((entry) => entry.id === routeId) ?? null
  const routePoints = routeEntry ? slipRoute(routeEntry, 'both') : undefined
  const focus = picked
  const standingEntry =
    slot && picked ? teamAtSector(entries, slot, picked.zone, picked.sector) : null
  const standing = standingEntry
    ? story.standings.find((row) => row.entryId === standingEntry.id)
    : null
  const history = useMemo(
    () =>
      picked
        ? sectorHistory(entries, catches, miniTours, story.slots, picked.zone, picked.sector)
        : [],
    [picked, entries, catches, miniTours, story.slots],
  )
  const tour = slot?.tour ?? 1
  const ticker = story.moments.slice(0, 12)

  return (
    <Stack gap="sm">
      <Group gap={6} wrap="wrap">
        <Button
          size="xs"
          variant={heatMode === 'slot' ? 'filled' : 'default'}
          onClick={() => setHeatMode('slot')}
        >
          Тепло окна
        </Button>
        <Button
          size="xs"
          variant={heatMode === 'day' ? 'filled' : 'default'}
          onClick={() => setHeatMode('day')}
        >
          Тепло дня
        </Button>
        <Button
          size="xs"
          variant={board ? 'filled' : 'default'}
          onClick={() => setBoard((value) => !value)}
        >
          {board ? 'Обычная карта' : 'Табло'}
        </Button>
        <Button
          size="xs"
          variant={shores ? 'filled' : 'default'}
          onClick={() => setShores((value) => !value)}
        >
          Два берега
        </Button>
        {routeEntry ? (
          <Button size="xs" variant="light" color="signal" onClick={() => setRouteId(null)}>
            Скрыть бумажку
          </Button>
        ) : null}
      </Group>
      <div
        style={board ? { display: 'flex', flexDirection: 'column', minHeight: '100dvh' } : undefined}
      >
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
              {ticker
                .map(
                  (moment) =>
                    `${formatCatchClock(moment.createdAt)} ${moment.athleteName ?? moment.teamName} ${gramsLabel(moment.grams)}`,
                )
                .join('   ·   ')}
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
              <Link
                to={`/live/t/${tournament.id}/team/${standingEntry.id}`}
                style={{ fontWeight: 700, color: 'inherit' }}
              >
                {standing.teamName}
              </Link>
              <Text size="sm">
                Место в группе{' '}
                {formatPlace(picked.zone === 'B' ? standing.zoneBPlace : standing.zoneAPlace)} · вес
                зоны{' '}
                {gramsLabel(picked.zone === 'B' ? standing.zoneBWeight : standing.zoneAWeight)}
              </Text>
              <Button
                size="xs"
                variant="light"
                w="fit-content"
                onClick={() => setRouteId(standingEntry.id)}
              >
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
                {slotTitle({ tour: row.tour, mini: row.mini })} · {row.teamName} ·{' '}
                {row.grams == null ? 'ещё не взвешена' : gramsLabel(row.grams)}
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
              {shoreLeaders(story.standings, tour, zone)
                .concat(
                  story.standings
                    .filter((row) => {
                      const entry = entries.find((item) => item.id === row.entryId)
                      const start = entry?.start_zone ?? entry?.draw_slip?.start_zone ?? null
                      return start != null && (tour === 1 ? start === zone : start !== zone)
                    })
                    .filter(
                      (row) =>
                        !shoreLeaders(story.standings, tour, zone).some(
                          (leader) => leader.entryId === row.entryId,
                        ),
                    ),
                )
                .map((row) => (
                  <Group key={row.entryId} justify="space-between">
                    <Link
                      to={`/live/t/${tournament.id}/team/${row.entryId}`}
                      style={{ color: 'inherit' }}
                    >
                      {row.teamName}
                    </Link>
                    <Text size="sm" className="pc-tabular">
                      {formatPlace(zone === 'B' ? row.zoneBPlace : row.zoneAPlace)} ·{' '}
                      {gramsLabel(zone === 'B' ? row.zoneBWeight : row.zoneAWeight)}
                    </Text>
                  </Group>
                ))}
            </Panel>
          ))}
        </SimpleGrid>
      ) : null}
      {shores ? (
        <Text size="sm" c="dimmed" className="pc-tabular">
          {ticker
            .map(
              (moment) =>
                `${formatCatchClock(moment.createdAt)} ${moment.athleteName ?? moment.teamName} ${gramsLabel(moment.grams)}`,
            )
            .join(' · ')}
        </Text>
      ) : null}
    </Stack>
  )
}
