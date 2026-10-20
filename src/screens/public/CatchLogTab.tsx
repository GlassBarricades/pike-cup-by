import { useMemo, useState } from 'react'
import { Anchor, Button, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { Link } from 'react-router-dom'
import { buildCatchLog, formatCatchClock } from '../../features/tournament/catchLog'
import {
  clockWeighSlot,
  fishingSlotsInOrder,
  getCurrentPhase,
  resolveMapWindow,
  slotTitle,
} from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import type { CatchRow, MiniTour, ScheduleSegment, Tournament, TournamentEntry, ZoneCode } from '../../features/tournament/types'
import { EmptyState } from '../../ui'

export function CatchLogTab({
  tournament,
  entries,
  catches,
  miniTours,
  segments,
}: {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  segments: ScheduleSegment[]
}) {
  const now = useNow(5_000)
  const [search, setSearch] = useState('')
  const [zone, setZone] = useState<ZoneCode | null>(null)
  const [tour, setTour] = useState<'all' | '1' | '2'>('all')
  const [miniPick, setMiniPick] = useState<string | null>(null)

  const phase = tournament.status === 'finished' ? null : getCurrentPhase(tournament, segments, now)
  const mapWindow = resolveMapWindow(tournament, segments, now)
  const clock = clockWeighSlot(mapWindow, segments, phase?.kind ?? (tournament.status === 'finished' ? 'after' : null))
  const clockKey = clock ? `${clock.tour}:${clock.mini}` : 'all'
  const miniFilter = miniPick ?? clockKey

  const slots = useMemo(() => fishingSlotsInOrder(segments), [segments])
  const log = useMemo(() => buildCatchLog(entries, catches, miniTours), [entries, catches, miniTours])

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru')
    const [tourPart, miniPart] = miniFilter.split(':')
    const miniTour = tourPart === '1' || tourPart === '2' ? Number(tourPart) : null
    const miniNumber = miniPart ? Number(miniPart) : null
    return log.filter((row) => {
      if (query && !row.teamName.toLocaleLowerCase('ru').includes(query) && !row.rosterNames.some((name) => name.toLocaleLowerCase('ru').includes(query))) {
        return false
      }
      if (zone && row.zone !== zone) return false
      if (tour !== 'all' && String(row.tour) !== tour) return false
      if (miniFilter !== 'all' && (row.tour !== miniTour || row.mini !== miniNumber)) return false
      return true
    })
  }, [log, search, zone, tour, miniFilter])

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Поиск: команда или рыбак"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
      />
      <Group gap={6} wrap="wrap">
        {(['A', 'B'] as const).map((value) => (
          <Button key={value} size="xs" variant={zone === value ? 'filled' : 'default'} color={value === 'A' ? 'zoneA' : 'zoneB'} onClick={() => setZone((current) => (current === value ? null : value))}>
            Зона {value}
          </Button>
        ))}
        {(
          [
            ['all', 'Все туры'],
            ['1', 'I тур'],
            ['2', 'II тур'],
          ] as const
        ).map(([value, label]) => (
          <Button key={value} size="xs" variant={tour === value ? 'filled' : 'default'} onClick={() => setTour(value)}>
            {label}
          </Button>
        ))}
        <Select
          aria-label="Мини-тур"
          size="xs"
          w={220}
          allowDeselect={false}
          value={miniFilter}
          onChange={(value) => setMiniPick(value ?? 'all')}
          data={[
            { value: 'all', label: 'Все мини-туры' },
            ...slots.map((slot) => ({
              value: `${slot.tour}:${slot.mini}`,
              label: slotTitle(slot) + (clock && slot.tour === clock.tour && slot.mini === clock.mini ? ' · сейчас' : ''),
            })),
          ]}
        />
      </Group>
      <Text size="xs" c="dimmed" className="pc-tabular">
        {rows.length} фиксаций
        {miniFilter === clockKey && clock ? ` · сейчас принимают ${slotTitle(clock)}` : ''}
      </Text>
      {rows.length === 0 ? (
        <EmptyState title="В этом срезе уловов нет" description="Смените зону, тур или мини-тур." />
      ) : (
        <Table.ScrollContainer minWidth={640}>
          <Table horizontalSpacing="sm" verticalSpacing={8}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Время</Table.Th>
                <Table.Th>Команда</Table.Th>
                <Table.Th>Мини-тур</Table.Th>
                <Table.Th>Зона</Table.Th>
                <Table.Th>Сектор</Table.Th>
                <Table.Th ta="right">Вес</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td className="pc-tabular">{formatCatchClock(row.createdAt)}</Table.Td>
                  <Table.Td>
                    <Anchor component={Link} to={`/tournament/${tournament.id}/team/${row.entryId}`} c="inherit" underline="never" fw={600}>
                      {row.teamName}
                    </Anchor>
                    {row.rosterNames.length > 0 ? (
                      <Text size="xs" c="dimmed">
                        {row.rosterNames.join(' · ')}
                      </Text>
                    ) : null}
                  </Table.Td>
                  <Table.Td>{row.tour && row.mini ? slotTitle({ tour: row.tour, mini: row.mini }) : '—'}</Table.Td>
                  <Table.Td>{row.zone ? `Зона ${row.zone}` : '—'}</Table.Td>
                  <Table.Td className="pc-tabular">{row.sector ?? '—'}</Table.Td>
                  <Table.Td ta="right" className="pc-tabular" fw={700}>
                    {row.grams.toLocaleString('ru-RU')} г
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </Stack>
  )
}
