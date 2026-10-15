import { Box, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link, useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate } from '../../features/tournament/date'
import { useZoneJudges } from '../../features/tournament/hooks'
import { getCurrentPhase, physicalZone } from '../../features/tournament/schedule'
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
  Leaderboard,
  NextAction,
  PageHero,
  PhaseClock,
  SectionTitle,
  StatusBadge,
  TabsBar,
  Timeline,
  ZoneSplit,
} from '../../ui'
import { ResultsTab } from './ResultsTab'
import { RulesTab } from './RulesTab'

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
}: {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  segments: ScheduleSegment[]
  showBack?: boolean
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
    const tour: 1 | 2 = phase?.segment?.key?.startsWith('tour2') ? 2 : 1
    const inA = entries.filter((e) => physicalZone(e.start_zone, tour) === 'A')
    const inB = entries.filter((e) => physicalZone(e.start_zone, tour) === 'B')
    const weighed = (list: TournamentEntry[]) =>
      list.filter((e) => tourWeight(e.id, tour, catches, miniTours) > 0).length
    return {
      zoneA: { weighed: weighed(inA), total: inA.length },
      zoneB: { weighed: weighed(inB), total: inB.length },
    }
  }, [entries, catches, miniTours, phase?.segment?.key])

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
        phase.kind === 'before'
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
    { value: 'teams', label: `Команды (${teamsSorted.length})` },
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
          <StatusBadge status={tournament.status} size="sm" />
        </Group>
        <Text size="xs" c="dimmed">
          {formatTournamentDate(tournament.event_date)} · {tournament.location}
        </Text>
        <PhaseClock
          phase={phase}
          delayMinutes={tournament.schedule_delay_minutes}
          paused={Boolean(tournament.schedule_paused_at)}
          archiveLabel={isFinished ? 'Архивный турнир — итоговый протокол' : undefined}
        />
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
          badge={<StatusBadge status={tournament.status} />}
        >
          <PhaseClock
            phase={phase}
            delayMinutes={tournament.schedule_delay_minutes}
            paused={Boolean(tournament.schedule_paused_at)}
            archiveLabel={isFinished ? 'Архивный турнир — итоговый протокол' : undefined}
          />
        </PageHero>
      </Stack>
    </Box>
  )

  return (
    <Stack gap="md">
      {headerMobile}
      {headerDesktop}

      <TabsBar tabs={tabs} defaultTab="overview">
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
                    <Leaderboard rows={top5} compact />
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
                        </Text>
                      </div>
                      {e.team_id && (
                        <Button
                          component={Link}
                          to={`/teams/${e.team_id}`}
                          variant="subtle"
                          color="gray"
                          size="compact-xs"
                        >
                          Карточка
                        </Button>
                      )}
                    </Group>
                  ))}
                </SimpleGrid>
              ))}

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
