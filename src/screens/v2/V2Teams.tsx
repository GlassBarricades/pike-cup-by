import { useMemo, useState } from 'react'
import { Anchor, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { Link } from 'react-router-dom'
import { setPrimaryCheer, toggleCheer, useCheer } from '../../features/tournament/cheer'
import { physicalZone } from '../../features/tournament/schedule'
import { slipSector } from '../../features/tournament/slips'
import { EmptyState } from '../../ui'
import { useV2Tournament } from './context'

export function V2Teams() {
  const { tournament, entries, story } = useV2Tournament()
  const [query, setQuery] = useState('')
  const cheer = useCheer(tournament.id)
  const slot = story.clock
  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru')
    const list = story.standings.flatMap((row) => {
      const entry = entries.find((item) => item.id === row.entryId)
      if (!entry) return []
      const haystack = [row.teamName, ...row.rosterNames].join(' ').toLocaleLowerCase('ru')
      if (needle && !haystack.includes(needle)) return []
      const zone = slot ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, slot.tour) : null
      const sector = slot ? slipSector(entry.draw_slip, slot.tour, slot.mini) : null
      return [{ row, zone, sector }]
    })
    list.sort((a, b) => a.row.teamName.localeCompare(b.row.teamName, 'ru'))
    return list
  }, [story.standings, entries, slot, query])

  if (story.standings.length === 0) return <EmptyState title="Заявок нет" />

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Команда или фамилия"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      {rows.length === 0 ? (
        <EmptyState title="Никого не нашли" />
      ) : (
        rows.map(({ row, zone, sector }) => (
          <Group key={row.entryId} justify="space-between" align="flex-start" wrap="nowrap" py={6} style={{ borderBottom: '1px solid var(--pc-line)' }}>
            <div>
              <Anchor component={Link} to={`/live/t/${tournament.id}/team/${row.entryId}`} fw={700} c="inherit" underline="never">
                {row.teamName}
              </Anchor>
              <Text size="xs" c="dimmed">
                {row.rosterNames.join(' · ')}
              </Text>
              <Text size="sm" mt={2}>
                {zone && sector != null ? `Зона ${zone} · сектор ${sector}` : 'Сектор ещё не открыт'}
              </Text>
            </div>
            <Group gap={4}>
              <Button
                size="compact-xs"
                variant={cheer.entryIds.includes(row.entryId) ? 'filled' : 'light'}
                color={cheer.entryIds.includes(row.entryId) ? 'signal' : undefined}
                onClick={() => toggleCheer(tournament.id, row.entryId)}
              >
                {cheer.entryIds.includes(row.entryId) ? 'Болею' : 'Болею за них'}
              </Button>
              {cheer.primaryId === row.entryId ? (
                <Text size="xs" c="var(--pc-signal)">
                  Главная
                </Text>
              ) : cheer.entryIds.includes(row.entryId) ? (
                <Button size="compact-xs" variant="default" onClick={() => setPrimaryCheer(tournament.id, row.entryId)}>
                  Главная
                </Button>
              ) : null}
            </Group>
          </Group>
        ))
      )}
    </Stack>
  )
}
