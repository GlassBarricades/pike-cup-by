import { useMemo, useState } from 'react'
import { Anchor, Button, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { readCheer } from '../../features/tournament/cheer'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone } from '../../features/tournament/schedule'
import { entryZonesWithCatch, gapLine, gramsLabel, sumGap, zoneExplanations, zoneGap } from '../../features/tournament/spectator'
import { useBoardMode, writeBoardMode, type BoardMode } from '../../features/tournament/v2Store'
import { EmptyState, Panel } from '../../ui'
import { useV2Tournament } from './context'
import { RulesComic } from './RulesComic'

const modes: { id: BoardMode; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'my-group', label: 'Моя группа' },
  { id: 'shore-a', label: 'Берег A' },
  { id: 'shore-b', label: 'Берег B' },
]

export function V2Table() {
  const { tournament, entries, catches, miniTours, story } = useV2Tournament()
  const mode = useBoardMode()
  const [comic, setComic] = useState(false)
  const cheerId = readCheer(tournament.id)
  const cheer = story.standings.find((row) => row.entryId === cheerId)
  const tour = story.clock?.tour ?? 2

  const rows = useMemo(() => {
    return story.standings.filter((row) => {
      if (mode === 'my-group') return cheer ? row.startZone === cheer.startZone : true
      if (mode === 'shore-a') return physicalZone(row.startZone, tour) === 'A'
      if (mode === 'shore-b') return physicalZone(row.startZone, tour) === 'B'
      return true
    })
  }, [story.standings, mode, cheer, tour])

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        В зачёт идёт сумма мест. Колонка «если по весу» показывает, как встал бы день по граммам.
      </Text>
      <Group justify="space-between" align="center">
        <Button size="xs" variant="default" onClick={() => setComic(true)}>
          Как считается место
        </Button>
        <Button component={Link} to={`/live/t/${tournament.id}/compare`} size="xs" variant="light">
          Сравнить две команды
        </Button>
      </Group>
      {comic ? <RulesComic onClose={() => setComic(false)} /> : null}
      <Group gap={6} wrap="wrap">
        {modes.map((item) => (
          <Button key={item.id} size="xs" variant={mode === item.id ? 'filled' : 'default'} onClick={() => writeBoardMode(item.id)}>
            {item.label}
          </Button>
        ))}
      </Group>
      {mode === 'my-group' && !cheer ? (
        <Text size="sm" c="dimmed">
          Отметьте «Болею» у команды на карточке — тогда здесь останется её стартовая группа.
        </Text>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="В этом срезе никого нет" />
      ) : (
        <Stack gap="xs">
          {rows.map((row) => {
            const entry = entries.find((item) => item.id === row.entryId)
            const opened = entry ? entryZonesWithCatch(entry, catches, miniTours) : { A: false, B: false }
            const notes = zoneExplanations(row, story.standings, story.zeroPlusOne, opened)
            const shore = physicalZone(row.startZone, tour)
            const gap = shore ? zoneGap(row, story.standings, shore) : sumGap(row, story.standings)
            const weightPlace = story.weightPlaces.get(row.entryId)
            return (
              <Panel key={row.entryId} p="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <div>
                    <Anchor component={Link} to={`/live/t/${tournament.id}/team/${row.entryId}`} fw={700} c="inherit" underline="never">
                      {row.teamName}
                    </Anchor>
                    <Text size="xs" c="dimmed">
                      {row.rosterNames.join(' · ')}
                    </Text>
                    <Text size="sm" mt={4}>
                      Сумма мест {formatPlace(row.placeSum)}
                      {weightPlace != null ? ` · если по весу ${formatPlace(weightPlace)}` : ''}
                    </Text>
                    <Text size="sm" className="pc-tabular" c="dimmed">
                      {gramsLabel(row.totalWeight)} · A {gramsLabel(row.zoneAWeight)} · B {gramsLabel(row.zoneBWeight)}
                    </Text>
                    {gapLine(gap) ? (
                      <Text size="sm" mt={4}>
                        {gapLine(gap)}
                      </Text>
                    ) : null}
                    {notes.map((note) => (
                      <Text key={note} size="xs" c="dimmed" mt={2}>
                        {note}
                      </Text>
                    ))}
                  </div>
                  <Text className="pc-display" c="var(--pc-signal)" style={{ fontSize: '1.6rem' }}>
                    {formatPlace(row.finalPlace)}
                  </Text>
                </Group>
              </Panel>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}
