import { Anchor, Box, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { formatTournamentDate } from '../../features/tournament/date'
import { buildCatchLog, formatCatchClock } from '../../features/tournament/catchLog'
import { useRefreshTournament } from '../../features/tournament/hooks'
import { getCompetitionStage, getCurrentPhase, slotTitle } from '../../features/tournament/schedule'
import {
  entryTeamName,
  type CatchRow,
  type MiniTour,
  type ScheduleSegment,
  type Tournament,
  type TournamentEntry,
} from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'
import {
  EmptyState,
  LakeBoard,
  PageHero,
  Panel,
  PhaseClock,
  SpectatorRefreshBar,
  StageBadge,
  TabsBar,
  Timeline,
} from '../../ui'
import { ResultsTab } from './ResultsTab'
import { CatchLogTab } from './CatchLogTab'
import { RulesTab } from './RulesTab'

function LatestWeighing({
  tournamentId,
  entries,
  catches,
  miniTours,
  live,
}: {
  tournamentId: string
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  live: boolean
}) {
  const { newCatchIds, hasRefreshed } = useRefreshTournament(tournamentId)
  const log = useMemo(() => buildCatchLog(entries, catches, miniTours), [entries, catches, miniTours])
  const delta = useMemo(() => {
    if (newCatchIds.length === 0) return []
    const ids = new Set(newCatchIds)
    return log.filter((row) => ids.has(row.id))
  }, [log, newCatchIds])

  if (!live && !hasRefreshed && log.length === 0) return null

  if (!hasRefreshed) {
    if (!live) return null
    return (
      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Новые взвешивания
        </Text>
        <Text size="sm" c="dimmed">
          Нажмите «Обновить» — здесь появятся уловы с прошлой проверки.
        </Text>
      </Panel>
    )
  }

  if (delta.length === 0) {
    return (
      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          С прошлого обновления
        </Text>
        <Text size="sm" c="dimmed">
          Новых взвешиваний нет
        </Text>
      </Panel>
    )
  }

  return (
    <Panel p="sm">
      <Text size="xs" c="dimmed" tt="uppercase" mb={6}>
        С прошлого обновления · {delta.length}
      </Text>
      <Stack gap={8}>
        {delta.map((row) => (
          <Group key={row.id} justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
            <div style={{ minWidth: 0 }}>
              <Text size="xs" c="dimmed">
                {formatCatchClock(row.createdAt)}
              </Text>
              <Anchor component={Link} to={`/tournament/${tournamentId}/team/${row.entryId}`} fw={700} c="inherit" underline="never">
                {row.teamName}
              </Anchor>
              <Text size="sm" c="dimmed">
                {row.tour && row.mini ? slotTitle({ tour: row.tour, mini: row.mini }) : 'Мини-тур'}
                {row.zone ? ` · зона ${row.zone}` : ''}
                {row.sector != null ? ` · сектор ${row.sector}` : ''}
              </Text>
            </div>
            <Text className="pc-display pc-tabular" c="var(--pc-signal)" style={{ fontSize: '1.4rem', flexShrink: 0 }}>
              {row.grams.toLocaleString('ru-RU')} г
            </Text>
          </Group>
        ))}
      </Stack>
    </Panel>
  )
}

export function TournamentView({
  tournament,
  entries,
  catches,
  miniTours,
  segments,
  showBack,
  spectator = false,
}: {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  segments: ScheduleSegment[]
  showBack?: boolean
  /** Экран зрителя: без повторных меток «идёт». Сигнал живёт в пункте меню LIVE. */
  spectator?: boolean
}) {
  const now = useNow(5_000)
  const stage = getCompetitionStage(tournament, segments, now)
  const isOver = stage === 'completed'
  const phase = isOver ? null : getCurrentPhase(tournament, segments, now)
  const activeKey = phase?.kind === 'active' ? phase.segment?.key : null

  const teamsSorted = useMemo(
    () => [...entries].sort((a, b) => entryTeamName(a).localeCompare(entryTeamName(b), 'ru')),
    [entries],
  )

  const tabs = [
    { value: 'results', label: 'Таблица' },
    { value: 'catches', label: 'Уловы' },
    { value: 'teams', label: `Команды (${teamsSorted.length})` },
    { value: 'map', label: 'Карта' },
    { value: 'schedule', label: 'Расписание' },
    { value: 'rules', label: 'Регламент' },
  ]

  const headerMobile = (
    <Box hiddenFrom="sm">
      <Stack gap="xs">
        {showBack && (
          <Button component={Link} to="/tournament" variant="subtle" color="gray" w="fit-content" px={0}>
            ← Все турниры
          </Button>
        )}
        <Group gap="sm" align="flex-start" wrap="nowrap">
          <Title order={3} className="pc-display" style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }} lineClamp={2}>
            {tournament.name}
          </Title>
          {!spectator && <StageBadge stage={stage} size="sm" />}
        </Group>
        <Text size="xs" c="dimmed">
          {formatTournamentDate(tournament.event_date)} · {tournament.location}
        </Text>
        <Stack gap={8}>
          <PhaseClock
            phase={phase}
            delayMinutes={tournament.schedule_delay_minutes}
            paused={Boolean(tournament.schedule_paused_at)}
            archiveLabel={isOver ? 'Завершено' : undefined}
            showLiveMark={false}
          />
          <LatestWeighing
            tournamentId={tournament.id}
            entries={entries}
            catches={catches}
            miniTours={miniTours}
            live={stage === 'live'}
          />
        </Stack>
      </Stack>
    </Box>
  )

  const headerDesktop = (
    <Box visibleFrom="sm">
      <Stack gap="sm">
        {showBack && (
          <Button component={Link} to="/tournament" variant="subtle" color="gray" w="fit-content" px={0}>
            ← Все турниры
          </Button>
        )}
        <PageHero
          title={tournament.name}
          subtitle={`${formatTournamentDate(tournament.event_date)} · ${tournament.location}`}
          badge={spectator ? undefined : <StageBadge stage={stage} />}
          mb={0}
        >
          <Stack gap={8}>
            <PhaseClock
              phase={phase}
              delayMinutes={tournament.schedule_delay_minutes}
              paused={Boolean(tournament.schedule_paused_at)}
              archiveLabel={isOver ? 'Завершено' : undefined}
              showLiveMark={false}
            />
            <LatestWeighing
              tournamentId={tournament.id}
              entries={entries}
              catches={catches}
              miniTours={miniTours}
              live={stage === 'live'}
            />
          </Stack>
        </PageHero>
      </Stack>
    </Box>
  )

  return (
    <Stack gap="md" pb="calc(5.5rem + env(safe-area-inset-bottom))">
      {headerMobile}
      {headerDesktop}
      {isOver ? (
        <Button component={Link} to={`/live/t/${tournament.id}/review`} size="sm" variant="light" color="signal" w="fit-content">
          Разбор
        </Button>
      ) : null}

      <TabsBar tabs={tabs} defaultTab="results">
        {(active) => (
          <>
            {active === 'results' && (
              <ResultsTab
                tournament={tournament}
                entries={entries}
                catches={catches}
                miniTours={miniTours}
                segments={segments}
              />
            )}

            {active === 'catches' && (
              <CatchLogTab
                tournament={tournament}
                entries={entries}
                catches={catches}
                miniTours={miniTours}
                segments={segments}
              />
            )}

            {active === 'teams' &&
              (teamsSorted.length === 0 ? (
                <EmptyState title="Нет заявок" />
              ) : (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                  {teamsSorted.map((e) => (
                    <Group
                      key={e.id}
                      justify="space-between"
                      p="sm"
                      style={{
                        border: '1px solid var(--pc-line)',
                        background: 'var(--pc-panel)',
                        borderRadius: 'var(--pc-radius)',
                      }}
                    >
                      <div>
                        <Text fw={600}>{entryTeamName(e)}</Text>
                        <Text size="xs" c="dimmed">
                          Старт: зона {e.start_zone ?? '—'}
                          {e.draw_slip ? ` · бумажка № ${e.draw_slip.code}` : ''}
                        </Text>
                      </div>
                      <Button
                        component={Link}
                        to={`/tournament/${tournament.id}/team/${e.id}`}
                        variant="subtle"
                        color="gray"
                        size="compact-xs"
                      >
                        Сейчас
                      </Button>
                    </Group>
                  ))}
                </SimpleGrid>
              ))}

            {active === 'map' && (
              <LakeBoard
                tournament={tournament}
                segments={segments}
                entries={entries}
                catches={catches}
                miniTours={miniTours}
                followCatches={stage === 'live'}
              />
            )}

            {active === 'schedule' && (
              <Timeline
                segments={segments}
                activeKey={activeKey}
                delayMinutes={tournament.schedule_delay_minutes}
              />
            )}

            {active === 'rules' && <RulesTab tournament={tournament} />}
          </>
        )}
      </TabsBar>
      <SpectatorRefreshBar tournamentId={tournament.id} />
    </Stack>
  )
}
