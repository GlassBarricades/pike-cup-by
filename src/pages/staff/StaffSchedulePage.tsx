import { Badge, Button, Group, NumberInput, Select, Stack, Text, Title } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { updateScheduleOps } from '../../features/tournament/api'
import { canManageTournament } from '../../features/auth/permissions'
import { useAuth } from '../../features/auth/AuthProvider'
import { tournamentKeys, useSegments } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { formatTime, getCurrentPhase } from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'

export function StaffSchedulePage() {
  const { role } = useAuth()
  const { selected: tournament } = useStaffTournament()
  const { data: segments = [] } = useSegments(tournament?.id)
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

  if (!tournament) {
    return <Text c="dimmed">Нет турнира</Text>
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
    <Stack gap="lg" maw={560} mx="auto">
      <Title order={2}>Расписание live</Title>
      <Group>
        <Badge color="depth" size="lg">
          {phase?.kind === 'active' ? phase.segment?.title : phase?.kind === 'before' ? 'До старта' : 'После'}
        </Badge>
        {tournament.schedule_paused_at && <Badge color="yellow">Пауза</Badge>}
      </Group>

      <Text size="sm" c="dimmed">
        Зрители видят этап автоматически. При заминке увеличьте сдвиг или поставьте паузу.
      </Text>

      <Group>
        <Button variant="light" onClick={() => applyDelay(tournament.schedule_delay_minutes + 5)}>
          +5 мин
        </Button>
        <Button variant="light" onClick={() => applyDelay(tournament.schedule_delay_minutes + 10)}>
          +10 мин
        </Button>
        <Button
          variant="light"
          onClick={() => applyDelay(Math.max(0, tournament.schedule_delay_minutes - 5))}
        >
          −5 мин
        </Button>
        <Button variant="subtle" onClick={() => applyDelay(0)}>
          Сброс
        </Button>
      </Group>

      <NumberInput
        label="Сдвиг, минуты"
        min={0}
        value={delay}
        onChange={setDelay}
      />
      <Button
        color="depth"
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
          <Button color="depth" onClick={resumeWithShift}>
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

      {canManageTournament(role) && (
        <Stack gap="xs" mt="md">
          <Text fw={600}>План (эффективное время)</Text>
          {segments.map((s) => (
            <Text key={s.id} size="sm">
              {formatTime(s.planned_starts_at, tournament.schedule_delay_minutes)}–
              {formatTime(s.planned_ends_at, tournament.schedule_delay_minutes)} · {s.title}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
