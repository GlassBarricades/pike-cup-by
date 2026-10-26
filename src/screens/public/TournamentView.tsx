import { Anchor, Box, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatTournamentDate } from '../../features/tournament/date'
import { buildCatchLog, formatCatchClock } from '../../features/tournament/catchLog'
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
  const latest = useMemo(() => buildCatchLog(entries, catches, miniTours)[0] ?? null, [entries, catches, miniTours])
  const known = useRef<Set<string>>(new Set())
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const ids = new Set(catches.map((row) => row.id))
    const seen = known.current
    if (seen.size > 0 && catches.some((row) => !seen.has(row.id))) {
      known.current = ids
      setFlash(true)
      const timer = window.setTimeout(() => setFlash(false), 1600)
      return () => window.clearTimeout(timer)
    }
    known.current = ids
  }, [catches])

  if (!latest) {
    if (!live) return null
    return (
      <Text size="sm" c="dimmed">
        Взвешиваний ещё не было
      </Text>
    )
  }

  return (
    <Panel p="sm" className={flash ? 'pc-peg-flash' : undefined}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <div style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Последнее взвешивание · {formatCatchClock(latest.createdAt)}
          </Text>
          <Anchor component={Link} to={`/tournament/${tournamentId}/team/${latest.entryId}`} fw={700} c="inherit" underline="never">
            {latest.teamName}
          </Anchor>
          <Text size="sm" c="dimmed">
            {latest.tour && latest.mini ? slotTitle({ tour: latest.tour, mini: latest.mini }) : 'Мини-тур'}
            {latest.zone ? ` · зона ${latest.zone}` : ''}
            {latest.sector != null ? ` · сектор ${latest.sector}` : ''}
          </Text>
        </div>
        <Text className="pc-display pc-tabular" c="var(--pc-signal)" style={{ fontSize: '1.6rem', flexShrink: 0 }}>
          {latest.grams.toLocaleString('ru-RU')} г
        </Text>
      </Group>
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
    <Stack gap="md">
      {headerMobile}
      {headerDesktop}

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
    </Stack>
  )
}
