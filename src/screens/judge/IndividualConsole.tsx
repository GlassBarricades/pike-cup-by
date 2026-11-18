import { useMemo, useState } from 'react'
import { ActionIcon, Badge, Button, Group, SegmentedControl, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconArrowLeft, IconBackspace, IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { addCatch, deleteCatch, isZoneWeighingCompleted, setZoneWeighingCompleted } from '../../features/tournament/api'
import { getFormat } from '../../features/tournament/formats'
import {
  tournamentKeys,
  useAthleteDraws,
  useCatches,
  useEntries,
  useMiniTours,
  useRefreshTournament,
  useSegments,
  useZoneJudges,
} from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import {
  getCurrentPhase,
  isFishingComplete,
  resolveMapWindow,
  resolveWeighTarget,
  slotTitle,
  tourNumberFromPhase,
} from '../../features/tournament/schedule'
import type { ZoneCode } from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'
import { entryTeamColumn, type CatchRow } from '../../features/tournament/types'
import { EmptyState } from '../../ui'

function WeightNumpad({
  athleteName,
  recordedGrams,
  targetLabel,
  saving,
  error,
  onSave,
  onClose,
}: {
  athleteName: string
  recordedGrams: number
  targetLabel: string | null
  saving: boolean
  error: string | null
  onSave: (grams: number) => void
  onClose: () => void
}) {
  const [digits, setDigits] = useState('')
  const value = Number(digits) || 0
  const canSave = value > 0
  const press = (d: string) => {
    if (saving) return
    setDigits((prev) => {
      if (prev.length >= 6) return prev
      if (prev === '0') return d
      return prev + d
    })
  }
  return (
    <Stack gap="sm" style={{ height: '100%' }}>
      <Group justify="space-between">
        <ActionIcon variant="subtle" onClick={onClose} aria-label="Назад">
          <IconArrowLeft size={20} />
        </ActionIcon>
        <Text fw={700} lineClamp={1}>
          {athleteName}
        </Text>
        <Badge variant="outline">{recordedGrams} г</Badge>
      </Group>
      {targetLabel && (
        <Text size="sm" c="dimmed">
          {targetLabel}
        </Text>
      )}
      <Text ta="center" className="pc-display" style={{ fontSize: '2.5rem' }}>
        {digits || '0'}
      </Text>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          flex: 1,
        }}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => (
          <Button
            key={key}
            size="xl"
            variant={key === 'C' || key === '⌫' ? 'light' : 'default'}
            onClick={() => {
              if (key === 'C') setDigits('')
              else if (key === '⌫') setDigits((prev) => prev.slice(0, -1))
              else press(key)
            }}
          >
            {key === '⌫' ? <IconBackspace size={22} /> : key}
          </Button>
        ))}
      </div>
      <Button color="signal" size="lg" disabled={!canSave} loading={saving} onClick={() => onSave(value)}>
        Записать
      </Button>
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
    </Stack>
  )
}

export function IndividualConsole() {
  const { user, role } = useAuth()
  const { selected: tournament } = useStaffTournament()
  const closed = useTournamentDayClosed()
  const format = tournament ? getFormat(tournament) : null
  const now = useNow(5_000)
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: catches = [] } = useCatches(tournament?.id)
  const { data: miniTours = [] } = useMiniTours(tournament?.id)
  const { data: segments = [] } = useSegments(tournament?.id)
  const { data: draws = [] } = useAthleteDraws(tournament?.id)
  const { data: zoneJudges = [] } = useZoneJudges(tournament?.id)
  const queryClient = useQueryClient()
  useRefreshTournament(tournament?.id)

  const [zone, setZone] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedTour, setSelectedTour] = useState(1)
  const [stepBack, setStepBack] = useState(false)

  const myZones = useMemo(() => {
    if (!user) return [] as string[]
    if (canManageTournament(role)) return format?.zones ?? ['A', 'B']
    return zoneJudges.filter((j) => j.user_id === user.id).map((j) => j.zone)
  }, [user, role, zoneJudges, format])

  const activeZone = zone && myZones.includes(zone) ? zone : myZones[0] ?? null

  const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
  const mapWindow = tournament ? resolveMapWindow(tournament, segments, now) : null
  const phaseTour = tourNumberFromPhase(phase)
  const weigh = mapWindow
    ? resolveWeighTarget({
        window: mapWindow,
        segments,
        phaseKind: phase?.kind ?? null,
        selectedTour,
        stepBack,
      })
    : { slot: null, note: null }

  const fishingDone = tournament ? isFishingComplete(tournament, segments, now) : false
  const weighingDone = isZoneWeighingCompleted(zoneJudges, activeZone as ZoneCode | null)
  const inputLocked = closed || weighingDone

  const weighDoneMutation = useMutation({
    mutationFn: (completed: boolean) => {
      if (!tournament || !activeZone) throw new Error('Нет зоны')
      return setZoneWeighingCompleted({
        tournamentId: tournament.id,
        zone: activeZone as ZoneCode,
        completed,
      })
    },
    onSuccess: async () => {
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.zoneJudges(tournament.id) })
      }
    },
  })

  const miniTour = useMemo(() => {
    if (!weigh.slot) return null
    return (
      miniTours.find((m) => m.tour_number === weigh.slot!.tour && m.mini_number === weigh.slot!.mini) ?? null
    )
  }, [miniTours, weigh.slot])

  const athletes = useMemo(() => {
    if (!activeZone || !weigh.slot) return []
    const inZone = new Set(
      draws
        .filter(
          (d) =>
            d.zone === activeZone &&
            d.tour_number === weigh.slot!.tour &&
            d.mini_number === weigh.slot!.mini,
        )
        .map((d) => d.roster_member_id),
    )
    const needle = search.trim().toLocaleLowerCase('ru')
    return entries
      .flatMap((entry) =>
        (entry.roster ?? [])
          .filter((m) => m.role === 'athlete' && inZone.has(m.id))
          .map((member) => {
            const draw = draws.find(
              (d) =>
                d.roster_member_id === member.id &&
                d.tour_number === weigh.slot!.tour &&
                d.mini_number === weigh.slot!.mini,
            )
            const miniWeight = catches
              .filter((c) => c.roster_member_id === member.id && c.mini_tour_id === miniTour?.id)
              .reduce((s, c) => s + c.weight_grams, 0)
            return {
              member,
              entry,
              sector: draw?.sector ?? 0,
              miniWeight,
              teamName: entryTeamColumn(entry),
            }
          }),
      )
      .filter((row) => {
        if (!needle) return true
        return (
          row.member.full_name_snapshot.toLocaleLowerCase('ru').includes(needle) ||
          row.teamName.toLocaleLowerCase('ru').includes(needle)
        )
      })
      .sort((a, b) => a.sector - b.sector || a.member.full_name_snapshot.localeCompare(b.member.full_name_snapshot, 'ru'))
  }, [activeZone, weigh.slot, draws, entries, search, catches, miniTour?.id])

  const selected = athletes.find((a) => a.member.id === selectedMemberId)

  const addMutation = useMutation({
    mutationFn: (grams: number) => {
      if (weighingDone) throw new Error('Взвешивание зоны завершено — нажмите «Продолжить взвешивание»')
      return addCatch({
        entryId: selected!.entry.id,
        rosterMemberId: selected!.member.id,
        miniTourId: miniTour!.id,
        weightGrams: grams,
        userId: user!.id,
        tournamentId: tournament!.id,
      })
    },
    onSuccess: async () => {
      setSelectedMemberId(null)
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournament.id) })
      }
    },
  })

  const undoMutation = useMutation({
    mutationFn: async () => {
      if (weighingDone) throw new Error('Взвешивание зоны завершено')
      const last = catches
        .filter((c) => c.roster_member_id === selectedMemberId && c.mini_tour_id === miniTour?.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] as CatchRow | undefined
      if (!last) throw new Error('Нечего отменять')
      await deleteCatch(last.id)
    },
    onSuccess: async () => {
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournament.id) })
      }
    },
  })

  if (!tournament || !format) {
    return <EmptyState title="Нет турнира" description="Выберите турнир в штабе." />
  }
  if (myZones.length === 0) {
    return <EmptyState title="Нет зоны" description="Вас ещё не назначили судьёй зоны." />
  }
  if (closed) {
    return <EmptyState title="День закрыт" description="Пульт недоступен после завершения." />
  }

  if (selected && miniTour && !inputLocked) {
    return (
      <div className="pc-page">
        <WeightNumpad
          athleteName={selected.member.full_name_snapshot}
          recordedGrams={selected.miniWeight}
          targetLabel={weigh.slot ? slotTitle(weigh.slot) : null}
          saving={addMutation.isPending}
          error={addMutation.isError ? (addMutation.error as Error).message : null}
          onSave={(grams) => addMutation.mutate(grams)}
          onClose={() => setSelectedMemberId(null)}
        />
        {selected.miniWeight > 0 && (
          <Button mt="sm" variant="light" color="red" loading={undoMutation.isPending} onClick={() => undoMutation.mutate()}>
            Отменить последнее взвешивание
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="pc-page">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700}>{tournament.name}</Text>
          <Badge>{activeZone}</Badge>
        </Group>
        {myZones.length > 1 && (
          <SegmentedControl
            fullWidth
            value={activeZone ?? undefined}
            onChange={setZone}
            data={myZones.map((z) => ({ value: z, label: `Зона ${z}` }))}
          />
        )}
        {fishingDone && (
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Text size="sm" c={weighingDone ? 'teal' : 'dimmed'}>
              {weighingDone
                ? `Зона ${activeZone}: взвешивание завершено`
                : 'Ловля окончена — вес пишется в последний мини-тур'}
            </Text>
            <Button
              size="compact-sm"
              color={weighingDone ? 'gray' : 'signal'}
              variant={weighingDone ? 'light' : 'filled'}
              loading={weighDoneMutation.isPending}
              disabled={!activeZone}
              onClick={() => {
                if (!weighingDone) {
                  if (!globalThis.confirm(`Отметить взвешивание зоны ${activeZone} как завершённое?`)) return
                }
                setSelectedMemberId(null)
                weighDoneMutation.mutate(!weighingDone)
              }}
            >
              {weighingDone ? 'Продолжить взвешивание' : 'Закончить взвешивание'}
            </Button>
          </Group>
        )}
        {weighDoneMutation.isError && (
          <Text size="sm" c="red">
            {(weighDoneMutation.error as Error).message}
          </Text>
        )}
        <Group grow>
          <SegmentedControl
            value={String(selectedTour)}
            onChange={(v) => setSelectedTour(Number(v))}
            data={format.tours.map((t) => ({ value: String(t.number), label: `Тур ${t.number}` }))}
          />
          <Button variant={stepBack ? 'filled' : 'light'} onClick={() => setStepBack((v) => !v)}>
            Шаг назад
          </Button>
        </Group>
        <Text size="sm" c="dimmed">
          {weigh.slot ? slotTitle(weigh.slot) : 'Нет активного мини-тура'}
          {phaseTour != null ? ` · часы: тур ${phaseTour}` : ''}
          {weigh.note ? ` · ${weigh.note}` : ''}
        </Text>
        <TextInput
          placeholder="Поиск"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
        <Stack gap={6}>
          {athletes.map((row) => (
            <UnstyledButton
              key={row.member.id}
              onClick={() => {
                if (!inputLocked) setSelectedMemberId(row.member.id)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--pc-line)',
                background: 'var(--pc-panel)',
                borderRadius: 'var(--pc-radius)',
                opacity: inputLocked ? 0.65 : 1,
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <div>
                  <Group gap={6} wrap="nowrap">
                    <Text fw={600}>{row.member.full_name_snapshot}</Text>
                    {row.member.is_junior && (
                      <Text span size="xs" c="teal" fw={700}>
                        Юн.
                      </Text>
                    )}
                  </Group>
                  <Text size="sm" c="dimmed">
                    {row.teamName} · сектор {row.sector || '—'}
                  </Text>
                </div>
                <Text fw={700}>{row.miniWeight} г</Text>
              </Group>
            </UnstyledButton>
          ))}
          {athletes.length === 0 && (
            <Text c="dimmed" size="sm">
              В этой зоне на текущий мини-тур никого нет.
            </Text>
          )}
        </Stack>
      </Stack>
    </div>
  )
}
