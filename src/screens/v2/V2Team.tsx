import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { setPrimaryCheer, toggleCheer, useCheer } from '../../features/tournament/cheer'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone, slotTitle } from '../../features/tournament/schedule'
import { bestWorstSlot, gapLine, gramsLabel, sumGap, zoneGap } from '../../features/tournament/spectator'
import { entryTeamName } from '../../features/tournament/types'
import { Panel } from '../../ui'
import { useV2Tournament } from './context'

export function V2Team() {
  const { entryId } = useParams()
  const { tournament, entries, story } = useV2Tournament()
  const cheer = useCheer(tournament.id)
  const entry = entries.find((item) => item.id === entryId)
  const cheerOn = Boolean(entry && cheer.entryIds.includes(entry.id))
  const primary = Boolean(entry && cheer.primaryId === entry.id)
  const standing = story.standings.find((row) => row.entryId === entryId)
  const matrix = story.matrix.find((row) => row.entryId === entryId)
  const ends = bestWorstSlot(matrix)
  const tour = story.clock?.tour ?? 1
  const shore = entry ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, tour) : null
  const gap = standing ? (shore ? zoneGap(standing, story.standings, shore) : sumGap(standing, story.standings)) : null
  const max = Math.max(1, ...(matrix?.cells.map((cell) => cell.grams ?? 0) ?? [1]))

  if (!entry || !standing) return <Text>Команда в этом турнире не найдена</Text>

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>{entryTeamName(entry)}</Title>
        <Text size="sm" c="dimmed">
          {(entry.roster ?? []).map((member) => member.full_name_snapshot).join(' · ') || 'Состав не указан'}
        </Text>
      </div>
      <Group gap={6} wrap="wrap">
        <Button
          size="xs"
          variant={cheerOn ? 'filled' : 'light'}
          color={cheerOn ? 'signal' : undefined}
          onClick={() => toggleCheer(tournament.id, entry.id)}
        >
          {cheerOn ? 'Хватит болеть' : 'Болею за них'}
        </Button>
        {cheerOn && !primary ? (
          <Button size="xs" variant="default" onClick={() => setPrimaryCheer(tournament.id, entry.id)}>
            Сделать главной
          </Button>
        ) : null}
        {primary ? (
          <Text size="xs" c="var(--pc-signal)">
            Главная для карты и группы
          </Text>
        ) : null}
        <Button component={Link} to={`/live/t/${tournament.id}/compare?a=${entry.id}`} size="xs" variant="default">
          Сравнить
        </Button>
        <Button component={Link} to={`/live/t/${tournament.id}/map?slip=${entry.id}`} size="xs" variant="default">
          Бумажка на карте
        </Button>
        {entry.team_id ? (
          <Button component={Link} to={`/live/teams/${entry.team_id}`} size="xs" variant="default">
            Пара за сезоны
          </Button>
        ) : null}
      </Group>

      <Group grow align="stretch">
        <Stat label="Зона A" value={formatPlace(standing.zoneAPlace)} hint={gramsLabel(standing.zoneAWeight)} />
        <Stat label="Зона B" value={formatPlace(standing.zoneBPlace)} hint={gramsLabel(standing.zoneBWeight)} />
        <Stat label="Сумма мест" value={formatPlace(standing.placeSum)} hint={gramsLabel(standing.totalWeight)} />
      </Group>
      {gap && gapLine(gap) ? <Text size="sm">{gapLine(gap)}</Text> : null}

      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Траектория дня
        </Text>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 172, marginTop: 12 }}>
          {story.slots.map((slot, index) => {
            const cell = matrix?.cells[index]
            const grams = cell?.grams ?? 0
            return (
              <div
                key={`${slot.tour}-${slot.mini}`}
                style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}
              >
                <Text ta="center" className="pc-tabular" style={{ fontSize: 11, lineHeight: 1.1 }}>
                  {cell?.grams == null ? '—' : cell.grams.toLocaleString('ru-RU')}
                </Text>
                <div
                  title={cell?.grams == null ? 'нет веса' : gramsLabel(cell.grams)}
                  style={{
                    height: `${Math.max(4, (grams / max) * 110)}px`,
                    marginTop: 4,
                    background: cell?.grams == null ? 'var(--pc-line)' : 'var(--pc-signal)',
                  }}
                />
                <Text size="xs" c="dimmed" ta="center" mt={4}>
                  {slot.tour}.{slot.mini}
                </Text>
              </div>
            )
          })}
        </div>
        <Text size="sm" mt="sm">
          {ends.best?.grams != null ? `Лучший слот: ${slotTitle(story.slots[ends.best.index])} · ${gramsLabel(ends.best.grams)}` : 'Взвешиваний нет'}
          {ends.worst?.grams != null ? ` · худший: ${slotTitle(story.slots[ends.worst.index])} · ${gramsLabel(ends.worst.grams)}` : ''}
        </Text>
      </Panel>

      <Stack gap={4}>
        {story.slots.map((slot, index) => {
          const cell = matrix?.cells[index]
          return (
            <Group key={`${slot.tour}-${slot.mini}`} justify="space-between">
              <Text size="sm">
                {slotTitle(slot)}
                {cell?.zone ? ` · зона ${cell.zone}` : ''}
                {cell?.sector != null ? ` · сектор ${cell.sector}` : ''}
              </Text>
              <Text size="sm" className="pc-tabular" fw={700}>
                {cell?.grams == null ? '—' : gramsLabel(cell.grams)}
                {cell?.place != null ? ` · ${formatPlace(cell.place)}` : ''}
              </Text>
            </Group>
          )
        })}
      </Stack>
    </Stack>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Panel p="sm">
      <Text size="xs" c="dimmed" tt="uppercase">
        {label}
      </Text>
      <Text className="pc-display" style={{ fontSize: '1.5rem' }}>
        {value}
      </Text>
      <Text size="sm" className="pc-tabular">
        {hint}
      </Text>
    </Panel>
  )
}
