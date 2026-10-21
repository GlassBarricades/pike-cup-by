import { Anchor, Box, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate } from '../../features/tournament/date'
import { useZoneJudges } from '../../features/tournament/hooks'
import { buildCatchLog, formatCatchClock } from '../../features/tournament/catchLog'
import { getCurrentPhase, physicalZone, slotTitle, tourNumberFromPhase } from '../../features/tournament/schedule'
import { computeStandings } from '../../features/tournament/scoring'
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
  Leaderboard,
  NextAction,
  PageHero,
  Panel,
  PhaseClock,
  SectionTitle,
  StatusBadge,
  TabsBar,
  Timeline,
  ZoneSplit,
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

function tourWeight(
  entryId: string,
  tourNumber: 1 | 2,
  catches: CatchRow[],
  miniTours: MiniTour[],
) {
  const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
  return catches
    .filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id))
    .reduce((s, c) => s + c.weight_grams, 0)
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
  const { user, role } = useAuth()
  const { data: zoneJudges = [] } = useZoneJudges(tournament.id)
  const [, setSearchParams] = useSearchParams()
  const isFinished = tournament.status === 'finished'
  const phase = !isFinished ? getCurrentPhase(tournament, segments, now) : null
  const isOrg = canManageTournament(role)

  const myJudgeZone = useMemo(() => {
    if (!user) return null
    return zoneJudges.find((j) => j.user_id === user.id)?.zone ?? null
  }, [zoneJudges, user])

  const standings = useMemo(
    () =>
      computeStandings(entries, catches, miniTours, {
        zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
      }),
    [entries, catches, miniTours, tournament.zero_place_is_group_size_plus_one],
  )

  const top5 = standings.slice(0, 5)

  const zoneProgress = useMemo(() => {
    const tour: 1 | 2 = tourNumberFromPhase(phase) ?? 1
    const inA = entries.filter((e) => physicalZone(e.start_zone, tour) === 'A')
    const inB = entries.filter((e) => physicalZone(e.start_zone, tour) === 'B')
    const weighed = (list: TournamentEntry[]) =>
      list.filter((e) => tourWeight(e.id, tour, catches, miniTours) > 0).length
    return {
      zoneA: { weighed: weighed(inA), total: inA.length },
      zoneB: { weighed: weighed(inB), total: inB.length },
    }
  }, [entries, catches, miniTours, phase])

  const teamsSorted = useMemo(
    () => [...entries].sort((a, b) => entryTeamName(a).localeCompare(entryTeamName(b), 'ru')),
    [entries],
  )

  const prepIncomplete = useMemo(() => {
    if (!isOrg || !tournament || tournament.status === 'live' || tournament.status === 'finished') {
      return false
    }
    const unassigned = entries.filter((e) => !e.start_zone).length
    const judgesA = zoneJudges.filter((j) => j.zone === 'A').length
    const judgesB = zoneJudges.filter((j) => j.zone === 'B').length
    const rulesLen = tournament.rules_content?.trim().length ?? 0
    const rulesOk = Boolean(tournament.rules_locked_at) || rulesLen > 40
    return (
      entries.length === 0 ||
      unassigned > 0 ||
      judgesA === 0 ||
      judgesB === 0 ||
      !rulesOk
    )
  }, [isOrg, tournament, entries, zoneJudges])

  const nextAction = (() => {
    if (myJudgeZone) {
      return (
        <NextAction
          title={`Вы судья зоны ${myJudgeZone}`}
          message="Откройте пульт для взвешивания команд на воде."
          ctaLabel="Открыть пульт"
          ctaTo="/staff/console"
        />
      )
    }
    if (prepIncomplete) {
      return (
        <NextAction
          title="Подготовка не завершена"
          message="Проверьте заявки, зоны, судей и регламент в штабе."
          ctaLabel="В Штаб"
          ctaTo="/staff"
          color="orange"
        />
      )
    }
    if (isFinished) {
      return (
        <NextAction
          title="Итоговый протокол"
          message="Турнир завершён — откройте полную таблицу."
          ctaLabel="Таблица"
          onCtaClick={() => setSearchParams({ tab: 'results' })}
          color="gray"
        />
      )
    }
    if (tournament.status === 'live' && phase) {
      const label =
        phase.kind === 'before' || phase.kind === 'gap'
          ? (phase.nextSegment?.title ?? 'До старта')
          : phase.kind === 'active'
            ? (phase.segment?.title ?? 'Этап')
            : 'Финиш дня'
      return (
        <NextAction
          title={label}
          message="Следите за фазой и результатами взвешивания."
          ctaLabel="Расписание"
          onCtaClick={() => setSearchParams({ tab: 'schedule' })}
        />
      )
    }
    return null
  })()

  const tabs = [
    { value: 'overview', label: 'Обзор' },
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
          {!spectator && <StatusBadge status={tournament.status} size="sm" />}
        </Group>
        <Text size="xs" c="dimmed">
          {formatTournamentDate(tournament.event_date)} · {tournament.location}
        </Text>
        <Stack gap={8}>
          <PhaseClock
            phase={phase}
            delayMinutes={tournament.schedule_delay_minutes}
            paused={Boolean(tournament.schedule_paused_at)}
            archiveLabel={isFinished ? 'Архивный турнир — итоговый протокол' : undefined}
            showLiveMark={false}
          />
          <LatestWeighing
            tournamentId={tournament.id}
            entries={entries}
            catches={catches}
            miniTours={miniTours}
            live={tournament.status === 'live'}
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
          badge={spectator ? undefined : <StatusBadge status={tournament.status} />}
          mb={0}
        >
          <Stack gap={8}>
            <PhaseClock
              phase={phase}
              delayMinutes={tournament.schedule_delay_minutes}
              paused={Boolean(tournament.schedule_paused_at)}
              archiveLabel={isFinished ? 'Архивный турнир — итоговый протокол' : undefined}
              showLiveMark={false}
            />
            <LatestWeighing
              tournamentId={tournament.id}
              entries={entries}
              catches={catches}
              miniTours={miniTours}
              live={tournament.status === 'live'}
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

      <TabsBar tabs={tabs} defaultTab={tournament.status === 'live' ? 'results' : 'overview'}>
        {(active) => (
          <>
            {active === 'overview' && (
              <Stack gap="md">
                {nextAction}
                <div>
                  <SectionTitle
                    action={
                      <Button
                        variant="subtle"
                        color="signal"
                        size="compact-sm"
                        onClick={() => setSearchParams({ tab: 'results' })}
                      >
                        Все
                      </Button>
                    }
                  >
                    Лидеры
                  </SectionTitle>
                  {top5.length === 0 ? (
                    <EmptyState title="Таблица пуста" description="Результаты появятся после взвешивания" />
                  ) : (
                    <Leaderboard rows={top5} compact tournamentId={tournament.id} />
                  )}
                </div>
                {!isFinished && (
                  <div>
                    <SectionTitle>Зоны · взвешивание</SectionTitle>
                    <ZoneSplit zoneA={zoneProgress.zoneA} zoneB={zoneProgress.zoneB} />
                  </div>
                )}
                <div>
                  <SectionTitle
                    action={
                      <Button
                        variant="subtle"
                        color="signal"
                        size="compact-sm"
                        onClick={() => setSearchParams({ tab: 'schedule' })}
                      >
                        Полное
                      </Button>
                    }
                  >
                    Расписание
                  </SectionTitle>
                  <Timeline
                    segments={segments.slice(0, 4)}
                    activeKey={phase?.segment?.key}
                    delayMinutes={tournament.schedule_delay_minutes}
                  />
                </div>
              </Stack>
            )}

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
                followCatches={tournament.status === 'live'}
              />
            )}

            {active === 'schedule' && (
              <Timeline
                segments={segments}
                activeKey={phase?.segment?.key}
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
