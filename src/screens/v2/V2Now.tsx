import { useMemo, useState } from 'react'
import { Anchor, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { useRefreshTournament } from '../../features/tournament/hooks'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone, slotTitle } from '../../features/tournament/schedule'
import {
  getFormat,
  hasIndividualStandings,
  showSpectatorRulesHint,
} from '../../features/tournament/formats'
import { formatPlaceShift, gramsLabel, shoreLeaders, sumGap, zoneGap, gapLine } from '../../features/tournament/spectator'
import { useCheer } from '../../features/tournament/cheer'
import { slipSector } from '../../features/tournament/slips'
import type { ZoneCode } from '../../features/tournament/types'
import { useRulesSeen } from '../../features/tournament/v2Store'
import { PhaseClock, Panel } from '../../ui'
import { useV2Tournament, type V2TournamentValue } from './context'
import { RulesComic } from './RulesComic'

type ZoneFilter = 'all' | ZoneCode

export function V2Now() {
  const { tournament, entries, story, results } = useV2Tournament()
  const format = getFormat(tournament)
  const showAthleteBoard = hasIndividualStandings(format) && results.engine === 'individual'
  const cheer = useCheer(tournament.id)
  const { newCatchIds, hasRefreshed } = useRefreshTournament(tournament.id)
  const seen = useRulesSeen()
  const [comic, setComic] = useState(!seen && showSpectatorRulesHint(format))
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const delta = useMemo(() => {
    if (newCatchIds.length === 0) return []
    const ids = new Set(newCatchIds)
    return story.moments.filter((moment) => {
      if (!ids.has(moment.id)) return false
      if (zoneFilter === 'all') return true
      return moment.zone === zoneFilter
    })
  }, [story.moments, newCatchIds, zoneFilter])
  const tour = story.clock?.tour ?? (story.mapWindow.state === 'moving' ? story.mapWindow.tour : 1)
  const closesMs = story.progress?.closesAt ? story.progress.closesAt.getTime() - story.phase.effectiveNow.getTime() : null
  const closesMin = closesMs == null ? null : Math.max(0, Math.ceil(closesMs / 60_000))
  const leadersA = shoreLeaders(story.standings, tour, 'A')
  const leadersB = shoreLeaders(story.standings, tour, 'B')
  const athleteLeaders = useMemo(() => {
    if (!showAthleteBoard) return { A: [], B: [] as typeof results.athletes }
    const open = results.athletes
    const byZone = (zone: 'A' | 'B') =>
      open
        .filter((row) => row.tours.find((t) => t.tour === tour)?.zone === zone)
        .sort((a, b) => {
          const pa = a.tours.find((t) => t.tour === tour)?.place ?? 999
          const pb = b.tours.find((t) => t.tour === tour)?.place ?? 999
          return pa - pb
        })
        .slice(0, 3)
    return { A: byZone('A'), B: byZone('B') }
  }, [showAthleteBoard, results, tour])

  return (
    <Stack gap="md">
      {showSpectatorRulesHint(format) && comic ? (
        <RulesComic format={format} onClose={() => setComic(false)} />
      ) : null}
      <PhaseClock
        phase={story.phase}
        delayMinutes={tournament.schedule_delay_minutes}
        paused={Boolean(tournament.schedule_paused_at)}
        archiveLabel={tournament.status === 'finished' ? 'Завершено' : undefined}
      />
      {story.shoreNote ? (
        <Panel p="sm">
          <Text size="sm">{story.shoreNote}</Text>
        </Panel>
      ) : null}
      <CheerStrip entries={entries} story={story} cheer={cheer} tournamentId={tournament.id} />

      <Group gap={6} wrap="wrap">
        {(
          [
            ['all', 'Все'],
            ['A', 'A'],
            ['B', 'B'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="xs"
            variant={zoneFilter === value ? 'filled' : 'default'}
            color={value === 'A' ? 'zoneA' : value === 'B' ? 'zoneB' : undefined}
            onClick={() => setZoneFilter(value)}
          >
            {label === 'Все' ? 'Все' : `Зона ${label}`}
          </Button>
        ))}
      </Group>

      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          {hasRefreshed ? 'С прошлого обновления' : 'Новые взвешивания'}
        </Text>
        {!hasRefreshed ? (
          <Text size="sm" c="dimmed">
            Нажмите «Обновить» — здесь появятся уловы с прошлой проверки.
          </Text>
        ) : delta.length === 0 ? (
          <Text size="sm" c="dimmed">
            Новых взвешиваний нет
          </Text>
        ) : (
          <Stack gap={8} mt={4}>
            {delta.map((moment) => (
              <Group key={moment.id} justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                  <Anchor component={Link} to={`/live/t/${tournament.id}/team/${moment.entryId}`} fw={700} c="inherit" underline="never">
                    {moment.athleteName ?? moment.teamName}
                  </Anchor>
                  <Text size="sm" c="dimmed">
                    {formatCatchClock(moment.createdAt)}
                    {moment.athleteName ? ` · ${moment.teamName}` : ''}
                    {moment.zone ? ` · зона ${moment.zone}` : ''}
                    {moment.sector != null ? ` · сектор ${moment.sector}` : ''}
                    {moment.tour && moment.mini ? ` · ${slotTitle({ tour: moment.tour, mini: moment.mini })}` : ''}
                  </Text>
                  <Text size="sm">
                    {formatPlaceShift(moment.zonePlaceBefore, moment.zonePlaceAfter)}
                    {moment.sumBefore != null && moment.sumAfter != null
                      ? ` · команда ${formatPlaceShift(moment.sumBefore, moment.sumAfter)}`
                      : ''}
                  </Text>
                </div>
                <Text className="pc-display pc-tabular" c="var(--pc-signal)" style={{ fontSize: '1.5rem' }}>
                  {gramsLabel(moment.grams)}
                </Text>
              </Group>
            ))}
          </Stack>
        )}
      </Panel>

      {story.progress ? (
        <Panel p="sm">
          <Text fw={700}>
            Взвешено {story.progress.weighed}/{story.progress.expected || '—'}
            {closesMin != null ? ` · окно закроется через ${closesMin} мин` : ''}
          </Text>
          <Text size="sm" c="dimmed">
            {slotTitle(story.progress.slot)}
          </Text>
          {(() => {
            const pending =
              zoneFilter === 'all'
                ? story.progress.pending
                : story.progress.pending.filter((row) => row.zone === zoneFilter)
            if (pending.length > 0) {
              return (
                <Text size="sm" mt={6}>
                  Ещё не взвешены:{' '}
                  {pending
                    .map((row) =>
                      tournament.draw_zones_only
                        ? `${row.teamName} (${row.zone})`
                        : `${row.teamName} (${row.zone}${row.sector})`,
                    )
                    .join(', ')}
                </Text>
              )
            }
            return (
              <Text size="sm" mt={6}>
                {zoneFilter === 'all' || story.progress.pending.length === 0
                  ? 'Окно закрыто по весам'
                  : 'В этой зоне все взвешены'}
              </Text>
            )
          })()}
        </Panel>
      ) : null}

      {story.closedWindow ? (
        <Stack gap={6}>
          <Text fw={700}>Итог {slotTitle(story.closedWindow.slot)}</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {story.closedWindow.zones
              .filter((zone) => zoneFilter === 'all' || zone.zone === zoneFilter)
              .map((zone) => (
              <Panel key={zone.zone} p="sm">
                <Text size="xs" c="dimmed" tt="uppercase">
                  Зона {zone.zone}
                </Text>
                <Text fw={700}>{zone.leaderNames.join(', ') || 'Лидер ещё не назван'}</Text>
                <Text size="sm" className="pc-tabular">
                  {zone.leaderGrams == null ? '—' : gramsLabel(zone.leaderGrams)}
                  {zone.averageGrams == null ? '' : ` · средний ${gramsLabel(Math.round(zone.averageGrams))}`}
                </Text>
                <Text size="sm" c="dimmed">
                  Нули: {zone.zeros} · взвешено {zone.weighed}/{zone.expected}
                </Text>
                {zone.firstTimeTop3.length > 0 ? (
                  <Text size="sm">Впервые в тройке: {zone.firstTimeTop3.join(', ')}</Text>
                ) : null}
              </Panel>
            ))}
          </SimpleGrid>
        </Stack>
      ) : null}

      <SimpleGrid cols={{ base: 1, sm: zoneFilter === 'all' ? 2 : 1 }} spacing="xs">
        {(['A', 'B'] as const)
          .filter((zone) => zoneFilter === 'all' || zone === zoneFilter)
          .map((zone) => {
          if (showAthleteBoard) {
            const leaders = athleteLeaders[zone]
            return (
              <Panel key={zone} p="sm">
                <Text size="xs" c="dimmed" tt="uppercase">
                  Лидеры зоны {zone}
                </Text>
                {leaders.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    На этом берегу ещё без веса
                  </Text>
                ) : (
                  leaders.map((row) => {
                    const tourRow = row.tours.find((t) => t.tour === tour)
                    return (
                      <Group key={row.rosterMemberId} justify="space-between">
                        <Anchor
                          component={Link}
                          to={`/live/t/${tournament.id}/team/${row.entryId}`}
                          c="inherit"
                          underline="never"
                        >
                          {formatPlace(tourRow?.place ?? row.finalPlace)}. {row.athleteName}
                        </Anchor>
                        <Text size="sm" className="pc-tabular">
                          {gramsLabel(tourRow?.weight ?? 0)}
                        </Text>
                      </Group>
                    )
                  })
                )}
              </Panel>
            )
          }
          const leaders = zone === 'A' ? leadersA : leadersB
          return (
            <Panel key={zone} p="sm">
              <Text size="xs" c="dimmed" tt="uppercase">
                Лидеры зоны {zone}
              </Text>
              {leaders.length === 0 ? (
                <Text size="sm" c="dimmed">
                  На этом берегу ещё без веса
                </Text>
              ) : (
                leaders.map((row) => (
                  <Group key={row.entryId} justify="space-between">
                    <Anchor component={Link} to={`/live/t/${tournament.id}/team/${row.entryId}`} c="inherit" underline="never">
                      {formatPlace(zone === 'B' ? row.zoneBPlace : row.zoneAPlace)}. {row.teamName}
                    </Anchor>
                    <Text size="sm" className="pc-tabular">
                      {gramsLabel(zone === 'B' ? row.zoneBWeight : row.zoneAWeight)}
                    </Text>
                  </Group>
                ))
              )}
            </Panel>
          )
        })}
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        <Panel p="sm">
          <Text size="xs" c="dimmed" tt="uppercase">
            Рекорды дня
          </Text>
          <RecordLine label="Тяжёлый мини-тур" value={story.records.heaviestMini ? `${story.records.heaviestMini.teamName} · ${gramsLabel(story.records.heaviestMini.grams)}` : '—'} />
          <RecordLine
            label="Тяжёлый сектор"
            value={
              story.records.heaviestSector
                ? `${story.records.heaviestSector.zone}${story.records.heaviestSector.sector} · ${story.records.heaviestSector.teamName} · ${gramsLabel(story.records.heaviestSector.grams)}`
                : '—'
            }
          />
          <RecordLine
            label="Скачок места"
            value={
              story.records.biggestJump
                ? `${story.records.biggestJump.teamName} · ${formatPlaceShift(story.records.biggestJump.from, story.records.biggestJump.to)}`
                : '—'
            }
          />
          <RecordLine
            label="Сухая зона"
            value={
              story.records.driestZone
                ? `Зона ${story.records.driestZone.zone} · нули ${story.records.driestZone.zeros}/${story.records.driestZone.weighed}`
                : '—'
            }
          />
        </Panel>
        <Panel p="sm">
          <Text size="xs" c="dimmed" tt="uppercase">
            За два мини-тура
          </Text>
          <Text size="sm" fw={700} mt={6}>
            Догоняют
          </Text>
          <MoverList rows={story.chasers.slice(0, 5)} tournamentId={tournament.id} empty="Пока некого сравнивать" />
          <Text size="sm" fw={700} mt={8}>
            Просели
          </Text>
          <MoverList rows={story.dropped.slice(0, 5)} tournamentId={tournament.id} empty="Никто не отдал сумму мест" />
        </Panel>
      </SimpleGrid>

      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Нули
        </Text>
        <ZeroList />
      </Panel>
    </Stack>
  )
}

function CheerStrip({
  entries,
  story,
  cheer,
  tournamentId,
}: {
  entries: V2TournamentValue['entries']
  story: V2TournamentValue['story']
  cheer: { entryIds: string[]; primaryId: string | null }
  tournamentId: string
}) {
  const ordered = [
    ...cheer.entryIds.filter((id) => id === cheer.primaryId),
    ...cheer.entryIds.filter((id) => id !== cheer.primaryId),
  ]
  const cards = ordered.flatMap((id) => {
    const standing = story.standings.find((row) => row.entryId === id)
    if (!standing) return []
    const entry = entries.find((item) => item.id === id)
    const slot = story.clock
    const zone = entry && slot ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, slot.tour) : null
    const sector = entry && slot ? slipSector(entry.draw_slip, slot.tour, slot.mini) : null
    const tour = slot?.tour ?? 1
    const shore = entry ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, tour) : null
    const gap = shore ? zoneGap(standing, story.standings, shore) : sumGap(standing, story.standings)
    const last = story.moments.find((moment) => moment.entryId === id)
    return [{ standing, zone, sector, gap, last, primary: id === cheer.primaryId }]
  })
  if (cards.length === 0) return null
  return (
    <Stack gap="xs">
      {cards.map((card) => (
        <Panel key={card.standing.entryId} p="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div>
              <Anchor component={Link} to={`/live/t/${tournamentId}/team/${card.standing.entryId}`} fw={700} c="inherit" underline="never">
                {card.standing.teamName}
              </Anchor>
              <Text size="xs" c="var(--pc-signal)">
                {card.primary ? 'Главная' : 'Болею'}
              </Text>
              <Text size="sm">
                Место {formatPlace(card.standing.finalPlace)}
                {card.zone && card.sector != null ? ` · зона ${card.zone} · сектор ${card.sector}` : ' · сектор ещё не открыт'}
              </Text>
              {gapLine(card.gap) ? <Text size="sm">{gapLine(card.gap)}</Text> : null}
            </div>
            <Text className="pc-display pc-tabular" c="var(--pc-signal)">
              {card.last ? gramsLabel(card.last.grams) : '—'}
            </Text>
          </Group>
        </Panel>
      ))}
    </Stack>
  )
}

function RecordLine({ label, value }: { label: string; value: string }) {
  return (
    <Text size="sm" mt={4}>
      <Text span c="dimmed">
        {label}.{' '}
      </Text>
      {value}
    </Text>
  )
}

function MoverList({
  rows,
  tournamentId,
  empty,
}: {
  rows: { entryId: string; teamName: string; sumThen: number; sumNow: number; delta: number }[]
  tournamentId: string
  empty: string
}) {
  if (rows.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        {empty}
      </Text>
    )
  }
  return (
    <Stack gap={2}>
      {rows.map((row) => (
        <Group key={row.entryId} justify="space-between">
          <Anchor component={Link} to={`/live/t/${tournamentId}/team/${row.entryId}`} size="sm" c="inherit" underline="never">
            {row.teamName}
          </Anchor>
          <Text size="sm" className="pc-tabular">
            {formatPlace(row.sumThen)} → {formatPlace(row.sumNow)}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}

function ZeroList() {
  const { tournament, story } = useV2Tournament()
  const zeros = story.matrix.flatMap((row) =>
    row.cells.flatMap((cell, index) => {
      const slot = story.slots[index]
      if (cell.grams !== 0 || !slot) return []
      return [{ entryId: row.entryId, teamName: row.teamName, zone: cell.zone, sector: cell.sector, slot }]
    }),
  )
  if (zeros.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Зафиксированных нулей нет
      </Text>
    )
  }
  return (
    <Stack gap={4} mt={6}>
      {zeros.map((row) => (
        <Group key={`${row.entryId}-${row.slot.tour}-${row.slot.mini}`} justify="space-between">
          <Anchor component={Link} to={`/live/t/${tournament.id}/team/${row.entryId}`} size="sm" c="inherit" underline="never">
            {row.teamName}
          </Anchor>
          <Text size="sm" c="dimmed">
            {slotTitle(row.slot)}
            {row.zone ? ` · зона ${row.zone}` : ''}
            {row.sector != null ? ` · сектор ${row.sector}` : ''}
          </Text>
        </Group>
      ))}
    </Stack>
  )
}
