import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { setPrimaryCheer, toggleCheer, useCheer, useCheerCounts } from '../../features/tournament/cheer'
import { getFormat, isIndividual } from '../../features/tournament/formats'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone, slotTitle } from '../../features/tournament/schedule'
import {
  bestWorstSlot,
  gapLine,
  gramsLabel,
  isIndividualSumBoardOpen,
  isPlaceSumOpenForStart,
  startGroupToursOpened,
  sumGap,
  zoneGap,
} from '../../features/tournament/spectator'
import { entryTeamName } from '../../features/tournament/types'
import { FanLikes, Panel } from '../../ui'
import { useV2Tournament } from './context'

export function V2Team() {
  const { entryId } = useParams()
  const { tournament, entries, catches, miniTours, story, results, draws } = useV2Tournament()
  const individual = isIndividual(getFormat(tournament))
  const cheer = useCheer(tournament.id)
  const { data: fanCounts } = useCheerCounts(tournament.id)
  const entry = entries.find((item) => item.id === entryId)
  const cheerOn = Boolean(entry && cheer.entryIds.includes(entry.id))
  const primary = Boolean(entry && cheer.primaryId === entry.id)
  const fans = entry ? (fanCounts?.get(entry.id) ?? 0) : 0

  const teamResult =
    individual && results.engine === 'individual'
      ? results.teams.find((row) => row.entryId === entryId)
      : null
  const standing = story.standings.find((row) => row.entryId === entryId)
  const matrix =
    (individual ? story.matrixTeams.find((row) => row.entryId === entryId) : null) ??
    story.matrix.find((row) => row.entryId === entryId && !row.rosterMemberId) ??
    story.matrixTeams.find((row) => row.entryId === entryId)
  const athleteRows =
    individual && results.engine === 'individual'
      ? [...results.athletes, ...results.juniors].filter((row) => row.entryId === entryId)
      : []
  const ends = bestWorstSlot(matrix)
  const tour = story.clock?.tour ?? 1
  const shore = entry ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, tour) : null
  const gap =
    standing && !individual
      ? shore
        ? zoneGap(standing, story.standings, shore)
        : sumGap(standing, story.standings)
      : standing
        ? sumGap(standing, story.standings)
        : null
  const max = Math.max(1, ...(matrix?.cells.map((cell) => cell.grams ?? 0) ?? [1]))
  const slot = story.clock

  if (!entry) return <Text>Команда в этом турнире не найдена</Text>
  if (!individual && !standing) return <Text>Команда в этом турнире не найдена</Text>
  if (individual && !teamResult && !standing) return <Text>Команда в этом турнире не найдена</Text>

  const placeSum = teamResult?.placeSum ?? standing?.placeSum ?? 0
  const totalWeight = teamResult?.totalWeight ?? standing?.totalWeight ?? 0
  const finalPlace = teamResult?.finalPlace ?? standing?.finalPlace ?? 0
  const opened = startGroupToursOpened(entries, catches, miniTours)
  const pikeSumOpen = standing ? isPlaceSumOpenForStart(standing.startZone, opened) : false
  const individualSumOpen = isIndividualSumBoardOpen(catches, miniTours, tournament.status)

  return (
    <Stack gap="md">
      <div>
        <Group gap={8} wrap="nowrap" align="center">
          <Title order={3}>{entryTeamName(entry)}</Title>
          <FanLikes
            count={fans}
            active={cheerOn}
            size="xs"
            onToggle={() => toggleCheer(tournament.id, entry.id)}
          />
        </Group>
        <Text size="sm" c="dimmed">
          {(entry.roster ?? [])
            .filter((m) => m.role === 'athlete')
            .map((member) => member.full_name_snapshot)
            .join(' · ') || 'Состав не указан'}
        </Text>
      </div>
      <Group gap={8} wrap="wrap" align="center">
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
        {individual ? (
          <Button component={Link} to={`/live/t/${tournament.id}/map`} size="xs" variant="default">
            Карта площадки
          </Button>
        ) : (
          <Button component={Link} to={`/live/t/${tournament.id}/map?slip=${entry.id}`} size="xs" variant="default">
            Бумажка на карте
          </Button>
        )}
        {entry.team_id ? (
          <Button component={Link} to={`/live/teams/${entry.team_id}`} size="xs" variant="default">
            Пара за сезоны
          </Button>
        ) : null}
      </Group>

      {individual && teamResult ? (
        <Group grow align="stretch">
          {teamResult.tours.map((t) => (
            <Stat
              key={t.tour}
              label={`Тур ${t.tour}`}
              value={formatPlace(t.place)}
              hint={`${t.zone ?? '—'} · ${gramsLabel(t.weight)}`}
            />
          ))}
          {individualSumOpen ? (
            <>
              <Stat label="Сумма мест" value={formatPlace(placeSum)} hint={gramsLabel(totalWeight)} />
              <Stat label="Место" value={formatPlace(finalPlace)} hint="" />
            </>
          ) : (
            <Stat label="Сумма мест" value="—" hint="после обоих туров" />
          )}
        </Group>
      ) : standing ? (
        <Group grow align="stretch">
          <Stat label="Зона A" value={formatPlace(standing.zoneAPlace)} hint={gramsLabel(standing.zoneAWeight)} />
          <Stat label="Зона B" value={formatPlace(standing.zoneBPlace)} hint={gramsLabel(standing.zoneBWeight)} />
          <Stat
            label="Сумма мест"
            value={pikeSumOpen ? formatPlace(standing.placeSum) : '—'}
            hint={pikeSumOpen ? gramsLabel(standing.totalWeight) : 'после обеих зон'}
          />
        </Group>
      ) : null}
      {gap && gapLine(gap) ? <Text size="sm">{gapLine(gap)}</Text> : null}

      {individual && athleteRows.length > 0 ? (
        <Panel p="sm">
          <Text size="xs" c="dimmed" tt="uppercase">
            Состав
          </Text>
          <Stack gap={6} mt={6}>
            {athleteRows.map((athlete) => {
              const draw = slot
                ? draws.find(
                    (d) =>
                      d.roster_member_id === athlete.rosterMemberId &&
                      d.tour_number === slot.tour &&
                      d.mini_number === slot.mini,
                  )
                : null
              return (
                <Group key={athlete.rosterMemberId} justify="space-between" wrap="nowrap">
                  <div>
                    <Text fw={600}>
                      {athlete.athleteName}
                      {athlete.junior ? ' · Юн.' : ''}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {draw
                        ? tournament.draw_zones_only
                          ? `Зона ${draw.zone}`
                          : `Зона ${draw.zone} · сектор ${draw.sector}`
                        : tournament.draw_zones_only
                          ? 'Зона —'
                          : 'Сектор —'}
                      {` · место ${formatPlace(athlete.finalPlace)}`}
                    </Text>
                  </div>
                  <Text fw={700} className="pc-tabular">
                    {gramsLabel(athlete.totalWeight)}
                  </Text>
                </Group>
              )
            })}
          </Stack>
        </Panel>
      ) : null}

      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Траектория дня
        </Text>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 172, marginTop: 12 }}>
          {story.slots.map((item, index) => {
            const cell = matrix?.cells[index]
            const grams = cell?.grams ?? 0
            return (
              <div
                key={`${item.tour}-${item.mini}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  height: '100%',
                }}
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
                  {item.tour}.{item.mini}
                </Text>
              </div>
            )
          })}
        </div>
        <Text size="sm" mt="sm">
          {ends.best?.grams != null
            ? `Лучший слот: ${slotTitle(story.slots[ends.best.index]!)} · ${gramsLabel(ends.best.grams)}`
            : 'Взвешиваний нет'}
          {ends.worst?.grams != null
            ? ` · худший: ${slotTitle(story.slots[ends.worst.index]!)} · ${gramsLabel(ends.worst.grams)}`
            : ''}
        </Text>
      </Panel>

      <Stack gap={4}>
        {story.slots.map((item, index) => {
          const cell = matrix?.cells[index]
          return (
            <Group key={`${item.tour}-${item.mini}`} justify="space-between">
              <Text size="sm">
                {slotTitle(item)}
                {cell?.zone ? ` · зона ${cell.zone}` : ''}
                {cell?.sector != null && !tournament.draw_zones_only ? ` · сектор ${cell.sector}` : ''}
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
      {hint ? (
        <Text size="sm" className="pc-tabular">
          {hint}
        </Text>
      ) : null}
    </Panel>
  )
}
