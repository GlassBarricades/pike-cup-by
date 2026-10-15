import { Button, Group, NumberInput, Select, SimpleGrid, Stack, Text } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconDeviceGamepad2, IconFishHook } from '@tabler/icons-react'
import { updateScheduleOps } from '../../features/tournament/api'
import { canManageTournament } from '../../features/auth/permissions'
import { useAuth } from '../../features/auth/AuthProvider'
import {
  tournamentKeys,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
} from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import {
  formatTime,
  getCurrentPhase,
  physicalZone,
} from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import type { CatchRow, MiniTour, TournamentEntry } from '../../features/tournament/types'
import {
  ActionTile,
  EmptyState,
  PageHero,
  Panel,
  PhaseClock,
  SectionTitle,
  ZoneSplit,
} from '../../ui'

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

export function DayScreen() {
  const { role } = useAuth()
  const { selected: tournament } = useStaffTournament()
  const { data: segments = [] } = useSegments(tournament?.id)
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: catches = [] } = useCatches(tournament?.id)
  const { data: miniTours = [] } = useMiniTours(tournament?.id)
  const queryClient = useQueryClient()
  const now = useNow(5_000)
  const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
  const [delay, setDelay] = useState<number | string>(tournament?.schedule_delay_minutes ?? 0)

  useEffect(() => {
    setDelay(tournament?.schedule_delay_minutes ?? 0)
  }, [tournament?.id, tournament?.schedule_delay_minutes])

  const mutation = useMutation({
    mutationFn: (patch: Parameters<typeof updateScheduleOps>[1]) =>
      updateScheduleOps(tournament!.id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournament.id) })
      }
    },
  })

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

  if (!tournament) {
    return (
      <EmptyState
        title="Нет турнира"
        description="Выберите турнир в штабе, чтобы управлять расписанием дня."
      />
    )
  }

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
    <Stack gap="lg">
      <PageHero
        title="Центр дня"
        subtitle="Зрители видят этап автоматически. При заминке увеличьте сдвиг или поставьте паузу."
      >
        <PhaseClock
          phase={phase}
          delayMinutes={tournament.schedule_delay_minutes}
          paused={Boolean(tournament.schedule_paused_at)}
          archiveLabel={
            tournament.status === 'finished' ? 'Турнир завершён — расписание архивное' : undefined
          }
        />
      </PageHero>

      <div>
        <SectionTitle>Прогресс зон</SectionTitle>
        <ZoneSplit zoneA={zoneProgress.zoneA} zoneB={zoneProgress.zoneB} />
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <ActionTile
          to="/staff/console"
          title="Пульт"
          description="Взвешивание на зоне"
          icon={IconDeviceGamepad2}
        />
        <ActionTile
          to="/staff/catches"
          title="Улов"
          description="Полный журнал"
          icon={IconFishHook}
        />
      </SimpleGrid>

      <Panel>
        <Stack gap="md">
          <SectionTitle>Сдвиг и пауза</SectionTitle>
          <Group>
            <Button variant="light" color="signal" onClick={() => applyDelay(tournament.schedule_delay_minutes + 5)}>
              +5 мин
            </Button>
            <Button variant="light" color="signal" onClick={() => applyDelay(tournament.schedule_delay_minutes + 10)}>
              +10 мин
            </Button>
            <Button
              variant="light"
              color="signal"
              onClick={() => applyDelay(Math.max(0, tournament.schedule_delay_minutes - 5))}
            >
              −5 мин
            </Button>
            <Button variant="subtle" color="gray" onClick={() => applyDelay(0)}>
              Сброс
            </Button>
          </Group>

          <NumberInput label="Сдвиг, минуты" min={0} value={delay} onChange={setDelay} />
          <Button
            color="signal"
            loading={mutation.isPending}
            onClick={() => applyDelay(Number(delay) || 0)}
          >
            Применить сдвиг
          </Button>

          <Group>
            {!tournament.schedule_paused_at ? (
              <Button color="yellow" variant="light" onClick={pause}>
                Пауза
              </Button>
            ) : (
              <Button color="signal" onClick={resumeWithShift}>
                Снять паузу и учесть сдвиг
              </Button>
            )}
          </Group>

          <Select
            label="Override этапа (редко)"
            clearable
            description="Оставьте пустым для авто-режима"
            data={segments.map((s) => ({ value: s.key, label: s.title }))}
            value={tournament.live_phase_override}
            onChange={(value) => mutation.mutate({ live_phase_override: value })}
          />
        </Stack>
      </Panel>

      {canManageTournament(role) && (
        <Panel>
          <Stack gap="xs">
            <Text fw={600}>План (эффективное время)</Text>
            {segments.map((s) => (
              <Text key={s.id} size="sm">
                {formatTime(s.planned_starts_at, tournament.schedule_delay_minutes)}–
                {formatTime(s.planned_ends_at, tournament.schedule_delay_minutes)} · {s.title}
              </Text>
            ))}
            {segments.length === 0 && (
              <Text size="sm" c="dimmed">
                Сегментов нет
              </Text>
            )}
          </Stack>
        </Panel>
      )}

      <Button component={Link} to="/staff" variant="subtle" color="gray" w="fit-content" px={0}>
        ← В штаб
      </Button>
    </Stack>
  )
}
