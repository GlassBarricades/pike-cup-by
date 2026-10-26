import { useState } from 'react'
import { Anchor, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone, slotTitle } from '../../features/tournament/schedule'
import { formatPlaceShift, gramsLabel, shoreLeaders, sumGap, zoneGap, gapLine } from '../../features/tournament/spectator'
import { useCheer } from '../../features/tournament/cheer'
import { slipSector } from '../../features/tournament/slips'
import { useRulesSeen } from '../../features/tournament/v2Store'
import { PhaseClock, Panel } from '../../ui'
import { useV2Tournament, type V2TournamentValue } from './context'
import { RulesComic } from './RulesComic'

export function V2Now() {
  const { tournament, entries, story } = useV2Tournament()
  const cheer = useCheer(tournament.id)
  const seen = useRulesSeen()
  const [comic, setComic] = useState(!seen)
  const latest = story.moments[0] ?? null
  const tour = story.clock?.tour ?? (story.mapWindow.state === 'moving' ? story.mapWindow.tour : 1)
  const closesMs = story.progress?.closesAt ? story.progress.closesAt.getTime() - story.phase.effectiveNow.getTime() : null
  const closesMin = closesMs == null ? null : Math.max(0, Math.ceil(closesMs / 60_000))
  const leadersA = shoreLeaders(story.standings, tour, 'A')
  const leadersB = shoreLeaders(story.standings, tour, 'B')

  return (
    <Stack gap="md">
      {comic ? <RulesComic onClose={() => setComic(false)} /> : null}
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

      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Последнее взвешивание
        </Text>
        {latest ? (
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div>
              <Anchor component={Link} to={`/live/t/${tournament.id}/team/${latest.entryId}`} fw={700} c="inherit" underline="never">
                {latest.teamName}
              </Anchor>
              <Text size="sm" c="dimmed">
                {formatCatchClock(latest.createdAt)}
                {latest.zone ? ` · зона ${latest.zone}` : ''}
                {latest.sector != null ? ` · сектор ${latest.sector}` : ''}
                {latest.tour && latest.mini ? ` · ${slotTitle({ tour: latest.tour, mini: latest.mini })}` : ''}
              </Text>
              <Text size="sm">{formatPlaceShift(latest.zonePlaceBefore, latest.zonePlaceAfter)}</Text>
            </div>
            <Text className="pc-display pc-tabular" c="var(--pc-signal)" style={{ fontSize: '1.8rem' }}>
              {gramsLabel(latest.grams)}
            </Text>
          </Group>
        ) : (
          <Text size="sm" c="dimmed">
            Взвешиваний ещё не было
          </Text>
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
          {story.progress.pending.length > 0 ? (
            <Text size="sm" mt={6}>
              Ещё не взвешены:{' '}
              {story.progress.pending.map((row) => `${row.teamName} (${row.zone}${row.sector})`).join(', ')}
            </Text>
          ) : (
            <Text size="sm" mt={6}>
              Окно закрыто по весам
            </Text>
          )}
        </Panel>
      ) : null}

      {story.closedWindow ? (
        <Stack gap={6}>
          <Text fw={700}>Итог {slotTitle(story.closedWindow.slot)}</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
            {story.closedWindow.zones.map((zone) => (
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

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        {(['A', 'B'] as const).map((zone) => {
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
