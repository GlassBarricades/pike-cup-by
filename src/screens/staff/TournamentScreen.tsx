import { useEffect, useState } from 'react'
import { Button, Checkbox, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageRoles } from '../../features/auth/permissions'
import { deleteTournament, restartTournament, updateScheduleOps, updateTournamentMeta } from '../../features/tournament/api'
import { formatTournamentDate } from '../../features/tournament/date'
import { tournamentKeys, useSegments } from '../../features/tournament/hooks'
import { getCompetitionStage, getCurrentPhase } from '../../features/tournament/schedule'
import { fishingScheduleReady } from '../../features/tournament/scheduleEdit'
import type { ScheduleSegment, Tournament, TournamentStatus } from '../../features/tournament/types'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import { useNow } from '../../features/tournament/useNow'
import { ClosedDayNotice, EmptyState, PageHero, Panel, PhaseClock, SectionTitle, StageBadge, TabsBar, Timeline } from '../../ui'
import { JudgesScreen } from './JudgesScreen'
import { RulesEditScreen } from './RulesEditScreen'
import { ScheduleEditor } from './ScheduleEditor'

const statusOptions = [
  { value: 'draft', label: 'Черновик' },
  { value: 'published', label: 'Опубликован' },
  { value: 'live', label: 'Идёт' },
  { value: 'finished', label: 'Завершён (архив)' },
]

export function TournamentScreen() {
  const { role } = useAuth()
  const isAdmin = canManageRoles(role)
  const { selected, setSelectedId, tournaments } = useStaffTournament()
  const { data: segments = [], isSuccess: segmentsReady } = useSegments(selected?.id)
  const now = useNow(15_000)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [status, setStatus] = useState<TournamentStatus>('published')
  const [organizers, setOrganizers] = useState('')
  const [zeroPlacePlusOne, setZeroPlacePlusOne] = useState(true)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!selected) return
    setName(selected.name)
    setLocation(selected.location)
    setEventDate(selected.event_date)
    setStatus(selected.status)
    setOrganizers(selected.organizers.join(', '))
    setZeroPlacePlusOne(selected.zero_place_is_group_size_plus_one !== false)
  }, [selected])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTournamentMeta(selected!.id, {
        name,
        location,
        event_date: eventDate,
        status,
        organizers: organizers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        zero_place_is_group_size_plus_one: zeroPlacePlusOne,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      if (selected) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(selected.id) })
      }
    },
  })

  const restartMutation = useMutation({
    mutationFn: () => restartTournament(selected!.id, eventDate),
    onSuccess: async () => {
      setStatus('live')
      const id = selected?.id
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      if (id) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(id) })
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.segments(id) })
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(id) })
      }
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (tournamentId: string) => deleteTournament(tournamentId),
    onSuccess: async (_data, tournamentId) => {
      const next = tournaments.find((tournament) => tournament.id !== tournamentId)
      setSelectedId(next?.id ?? null)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      queryClient.removeQueries({ queryKey: ['tournament', tournamentId] })
    },
  })

  if (!selected) {
    return (
      <EmptyState
        title="Нет выбранного турнира"
        description="Выберите турнир в меню слева."
      />
    )
  }

  const stage =
    selected.status === 'finished' || segmentsReady
      ? getCompetitionStage(selected, segments, now)
      : null

  return (
    <Stack gap="lg">
      <PageHero
        title={selected.name}
        subtitle={`${formatTournamentDate(selected.event_date)} · ${selected.location}`}
        badge={stage ? <StageBadge stage={stage} /> : undefined}
        mb={0}
      />

      <TabsBar
        tabs={[
          { value: 'card', label: 'Карточка' },
          { value: 'rules', label: 'Регламент' },
          { value: 'schedule', label: 'Расписание' },
          { value: 'judges', label: 'Судьи' },
        ]}
        defaultTab="card"
      >
        {(active) =>
          active === 'rules' ? (
            <RulesEditScreen embedded />
          ) : active === 'schedule' ? (
            <ScheduleTab tournament={selected} segments={segments} ready={segmentsReady} />
          ) : active === 'judges' ? (
            <JudgesScreen embedded />
          ) : (
            <Stack gap="md">
              <Panel>
                <Stack gap="md">
                  <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
                  <TextInput
                    label="Дата"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.currentTarget.value)}
                  />
                  <TextInput label="Место" value={location} onChange={(e) => setLocation(e.currentTarget.value)} />
                  <TextInput
                    label="Оргкомитет (через запятую)"
                    value={organizers}
                    onChange={(e) => setOrganizers(e.currentTarget.value)}
                  />
                  <Select
                    label="Статус"
                    description="Регистрация, лайф и завершение дня считаются по расписанию. Здесь отмечают черновик и архив."
                    data={statusOptions}
                    value={status}
                    onChange={(v) => setStatus((v as TournamentStatus) ?? 'published')}
                  />
                  <Checkbox
                    label="Ноль улова = размер группы + 1"
                    description="Если выключено — ноль даёт место равное размеру группы"
                    checked={zeroPlacePlusOne}
                    onChange={(e) => setZeroPlacePlusOne(e.currentTarget.checked)}
                  />
                  <Button color="signal" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                    Сохранить
                  </Button>
                  {saveMutation.isSuccess && (
                    <Text size="sm" c="dimmed">
                      Сохранено
                    </Text>
                  )}
                  {saveMutation.isError && (
                    <Text c="red" size="sm">
                      {(saveMutation.error as Error).message}
                    </Text>
                  )}
                </Stack>
              </Panel>

              {isAdmin && (
                <Panel>
                  <Stack gap="sm">
                    <Button
                      variant="light"
                      color="yellow"
                      disabled={!eventDate}
                      loading={restartMutation.isPending}
                      onClick={() => {
                        if (
                          !window.confirm(
                            `Перезапустить «${selected.name}» на ${eventDate}? Расписание переедет на эту дату, сдвиг и пауза сбросятся, уловы сотрутся, статус станет «Идёт». Заявки и бумажки останутся.`,
                          )
                        ) {
                          return
                        }
                        restartMutation.mutate()
                      }}
                    >
                      Перезапустить турнир
                    </Button>
                    <Text size="xs" c="dimmed">
                      Для отладки. Кнопка видна только администратору.
                    </Text>
                    {restartMutation.isError && (
                      <Text c="red" size="sm">
                        {(restartMutation.error as Error).message}
                      </Text>
                    )}
                  </Stack>
                </Panel>
              )}

              <Panel>
                <Stack gap="sm">
                  <Button
                    color="red"
                    variant="light"
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Удалить турнир «${selected.name}»? Заявки, составы, уловы, расписание, судьи зон и регламент этого турнира будут стёрты. Справочник команд, спортсменов и бумажек останется.`,
                        )
                      ) {
                        return
                      }
                      deleteMutation.mutate(selected.id)
                    }}
                  >
                    Удалить турнир
                  </Button>
                  {deleteMutation.isError && (
                    <Text c="red" size="sm">
                      {(deleteMutation.error as Error).message}
                    </Text>
                  )}
                </Stack>
              </Panel>
            </Stack>
          )
        }
      </TabsBar>
    </Stack>
  )
}

function ScheduleTab({
  tournament,
  segments,
  ready,
}: {
  tournament: Tournament
  segments: ScheduleSegment[]
  ready: boolean
}) {
  const closed = useTournamentDayClosed()

  if (!ready) {
    return <Text c="dimmed">Загрузка расписания…</Text>
  }

  return (
    <Stack gap="md">
      {closed && <ClosedDayNotice />}
      <div>
        <SectionTitle>Как видят зрители</SectionTitle>
        <Timeline segments={segments} delayMinutes={tournament.schedule_delay_minutes} />
      </div>
      <ScheduleOps tournament={tournament} segments={segments} closed={closed} />
      {fishingScheduleReady(segments) ? (
        <ScheduleEditor tournamentId={tournament.id} segments={segments} disabled={closed} />
      ) : (
        <Text size="sm" c="dimmed">
          Это расписание нельзя править как день соревнования: в нём нет полного набора мини-туров.
        </Text>
      )}
    </Stack>
  )
}

function ScheduleOps({
  tournament,
  segments,
  closed,
}: {
  tournament: Tournament
  segments: ScheduleSegment[]
  closed: boolean
}) {
  const now = useNow(5_000)
  const phase = getCurrentPhase(tournament, segments, now)
  const [delay, setDelay] = useState<number | string>(tournament.schedule_delay_minutes)
  const queryClient = useQueryClient()

  useEffect(() => {
    setDelay(tournament.schedule_delay_minutes)
  }, [tournament.id, tournament.schedule_delay_minutes])

  const mutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateScheduleOps>[1]) => updateScheduleOps(tournament.id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournament.id) })
    },
  })

  const applyDelay = (minutes: number) => {
    setDelay(minutes)
    mutation.mutate({ schedule_delay_minutes: minutes })
  }

  const pause = () => {
    mutation.mutate({ schedule_paused_at: new Date().toISOString() })
  }

  const resumeWithShift = () => {
    if (!tournament.schedule_paused_at) return
    const pausedMs = Date.now() - new Date(tournament.schedule_paused_at).getTime()
    const extra = Math.max(0, Math.ceil(pausedMs / 60_000))
    const nextDelay = tournament.schedule_delay_minutes + extra
    setDelay(nextDelay)
    mutation.mutate({
      schedule_paused_at: null,
      schedule_delay_minutes: nextDelay,
    })
  }

  return (
    <Panel>
      <Stack gap="md">
        <PhaseClock
          phase={phase}
          delayMinutes={tournament.schedule_delay_minutes}
          paused={Boolean(tournament.schedule_paused_at)}
          archiveLabel={tournament.status === 'finished' ? 'Турнир завершён — расписание архивное' : undefined}
        />
        <SectionTitle>Сдвиг и пауза</SectionTitle>
        <Text size="sm" c="dimmed">
          Если на воде заминка, сдвиньте часы. Запись расписания ниже сбрасывает сдвиг и паузу.
        </Text>
        <Group>
          <Button variant="light" color="signal" disabled={closed} onClick={() => applyDelay(tournament.schedule_delay_minutes + 5)}>
            +5 мин
          </Button>
          <Button variant="light" color="signal" disabled={closed} onClick={() => applyDelay(tournament.schedule_delay_minutes + 10)}>
            +10 мин
          </Button>
          <Button
            variant="light"
            color="signal"
            disabled={closed}
            onClick={() => applyDelay(Math.max(0, tournament.schedule_delay_minutes - 5))}
          >
            −5 мин
          </Button>
          <Button variant="subtle" color="gray" disabled={closed} onClick={() => applyDelay(0)}>
            Сброс
          </Button>
        </Group>
        <NumberInput label="Сдвиг, минуты" min={0} value={delay} onChange={setDelay} disabled={closed} />
        <Button color="signal" disabled={closed} loading={mutation.isPending} onClick={() => applyDelay(Number(delay) || 0)}>
          Применить сдвиг
        </Button>
        <Group>
          {!tournament.schedule_paused_at ? (
            <Button color="yellow" variant="light" disabled={closed} onClick={pause}>
              Пауза
            </Button>
          ) : (
            <Button color="signal" disabled={closed} onClick={resumeWithShift}>
              Снять паузу и учесть сдвиг
            </Button>
          )}
        </Group>
        <Select
          label="Override этапа"
          clearable
          disabled={closed}
          description="Оставьте пустым: этап идёт по часам"
          data={segments.map((segment) => ({ value: segment.key, label: segment.title }))}
          value={tournament.live_phase_override}
          onChange={(value) => mutation.mutate({ live_phase_override: value })}
        />
        {mutation.isError && (
          <Text c="red" size="sm">
            {(mutation.error as Error).message}
          </Text>
        )}
      </Stack>
    </Panel>
  )
}
