import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Group, SegmentedControl, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { addCatch, deleteCatch, isZoneWeighingCompleted, setZoneWeighingCompleted } from '../../features/tournament/api'
import { getFormat } from '../../features/tournament/formats'
import {
  tournamentKeys,
  useAthleteDraws,
  useCatchAuthors,
  useCatches,
  useEntries,
  useMiniTours,
  useRefreshTournament,
  useSegments,
  useZoneJudges,
} from '../../features/tournament/hooks'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import {
  getCurrentPhase,
  isFishingComplete,
  previousFishingSlot,
  resolveMapWindow,
  resolveWeighTarget,
  slotTitle,
  tourNumberFromPhase,
} from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import { entryTeamColumn, type CatchRow, type Tournament, type ZoneCode } from '../../features/tournament/types'
import { EmptyState, VenueMapView } from '../../ui'
import { WeightNumpad } from './WeightNumpad'

type Panel = 'console' | 'results'

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function memberMiniCatches(memberId: string, miniTourId: string | null | undefined, catches: CatchRow[]): CatchRow[] {
  if (!miniTourId) return []
  return catches
    .filter((c) => c.roster_member_id === memberId && c.mini_tour_id === miniTourId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function memberMiniWeight(memberId: string, miniTourId: string | null | undefined, catches: CatchRow[]): number {
  return memberMiniCatches(memberId, miniTourId, catches).reduce((sum, c) => sum + c.weight_grams, 0)
}

export function IndividualConsole({
  tournament,
  assignedZone,
}: {
  tournament: Tournament
  assignedZone: ZoneCode | null
}) {
  const { user, role } = useAuth()
  const isOrg = canManageTournament(role)
  const closed = useTournamentDayClosed(tournament)
  const format = getFormat(tournament)
  const tournamentId = tournament.id
  const now = useNow()

  const { data: entries = [] } = useEntries(tournamentId)
  const { data: catches = [] } = useCatches(tournamentId)
  const { data: miniTours = [] } = useMiniTours(tournamentId)
  const { data: segments = [] } = useSegments(tournamentId)
  const { data: draws = [] } = useAthleteDraws(tournamentId)
  const { data: zoneJudges = [], isPending: zoneJudgesPending } = useZoneJudges(tournamentId)
  const { data: authors } = useCatchAuthors(catches)
  const { refresh, isFetching: refreshing } = useRefreshTournament(tournamentId)

  const queryClient = useQueryClient()
  const scrollerRef = useRef<HTMLDivElement>(null)

  const myZones = useMemo(() => {
    if (!user) return [] as ZoneCode[]
    if (assignedZone) return [assignedZone]
    if (isOrg) return (format.zones ?? ['A', 'B']) as ZoneCode[]
    return zoneJudges.filter((j) => j.user_id === user.id).map((j) => j.zone)
  }, [user, isOrg, zoneJudges, format, assignedZone])

  const [orgZone, setOrgZone] = useState<ZoneCode | null>(null)
  const zone: ZoneCode | null =
    myZones.length === 0 ? null : orgZone && myZones.includes(orgZone) ? orgZone : myZones[0]!

  const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
  const scheduleTour = tourNumberFromPhase(phase)
  const [manualTour, setManualTour] = useState<number | null>(null)
  const tourNumber: number = manualTour ?? scheduleTour ?? 1

  useEffect(() => {
    if (scheduleTour) setManualTour(null)
  }, [scheduleTour])

  const [panel, setPanel] = useState<Panel>('console')
  const [search, setSearch] = useState('')
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [failedSave, setFailedSave] = useState<{
    grams: number
    entryId: string
    rosterMemberId: string
    miniTourId: string
  } | null>(null)
  const [savedNote, setSavedNote] = useState(false)
  const [showVenueMap, setShowVenueMap] = useState(false)
  const swipeLocked = Boolean(editingMemberId)

  const mapWindow = tournament ? resolveMapWindow(tournament, segments, now) : null
  const clockKey = mapWindow
    ? `${mapWindow.state}-${mapWindow.state === 'off' ? mapWindow.label : `${mapWindow.tour}-${mapWindow.mini}`}-${phase?.kind ?? ''}-${tourNumber}`
    : 'none'
  const [stepState, setStepState] = useState({ key: '', back: false })
  if (stepState.key !== clockKey) {
    setStepState({ key: clockKey, back: false })
  }
  const baseTarget = mapWindow
    ? resolveWeighTarget({
        window: mapWindow,
        segments,
        phaseKind: phase?.kind ?? null,
        selectedTour: tourNumber,
        stepBack: false,
      })
    : { slot: null, note: null }
  const weighTarget = mapWindow
    ? resolveWeighTarget({
        window: mapWindow,
        segments,
        phaseKind: phase?.kind ?? null,
        selectedTour: tourNumber,
        stepBack: stepState.back,
      })
    : baseTarget
  const canStepBack = baseTarget.slot != null && previousFishingSlot(baseTarget.slot, segments) != null
  const weighMini =
    weighTarget.slot == null
      ? null
      : (miniTours.find(
          (mini) => mini.tour_number === weighTarget.slot?.tour && mini.mini_number === weighTarget.slot?.mini,
        ) ?? null)
  const weighMiniId = weighMini?.id ?? null
  const weighLabel = weighTarget.slot
    ? `${slotTitle(weighTarget.slot)}${weighTarget.note ? ` · ${weighTarget.note}` : ''}`
    : null
  const msLeft =
    phase?.endsAtEffective != null
      ? Math.max(0, phase.endsAtEffective.getTime() - phase.effectiveNow.getTime())
      : null
  const minutesLeft =
    msLeft != null && (phase?.kind === 'active' || phase?.kind === 'gap') ? Math.ceil(msLeft / 60_000) : null

  const athletes = useMemo(() => {
    if (!zone || !weighTarget.slot) return []
    const inZone = new Set(
      draws
        .filter(
          (d) =>
            d.zone === zone &&
            d.tour_number === weighTarget.slot!.tour &&
            d.mini_number === weighTarget.slot!.mini,
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
                d.tour_number === weighTarget.slot!.tour &&
                d.mini_number === weighTarget.slot!.mini,
            )
            const rows = memberMiniCatches(member.id, weighMiniId, catches)
            const weight = rows.reduce((s, c) => s + c.weight_grams, 0)
            return {
              member,
              entry,
              sector: draw?.sector ?? 0,
              weight,
              rows,
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
      .sort(
        (a, b) =>
          a.sector - b.sector ||
          a.member.full_name_snapshot.localeCompare(b.member.full_name_snapshot, 'ru'),
      )
  }, [zone, weighTarget.slot, draws, entries, search, catches, weighMiniId])

  const weighedCount = useMemo(() => athletes.filter((a) => a.weight > 0).length, [athletes])

  const resultGroups = useMemo(
    () =>
      athletes
        .filter((a) => a.rows.length > 0)
        .sort((a, b) => a.member.full_name_snapshot.localeCompare(b.member.full_name_snapshot, 'ru')),
    [athletes],
  )

  const editing = athletes.find((a) => a.member.id === editingMemberId) ?? null
  const editingWeight = editing
    ? memberMiniWeight(editing.member.id, weighMiniId, catches)
    : 0

  const fishingDone = tournament ? isFishingComplete(tournament, segments, now) : false
  const weighingDone = isZoneWeighingCompleted(zoneJudges, zone)
  const inputLocked = closed || weighingDone

  const invalidate = useCallback(async () => {
    if (tournamentId) {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournamentId) })
    }
  }, [queryClient, tournamentId])

  const weighDoneMutation = useMutation({
    mutationFn: (completed: boolean) => {
      if (!tournamentId || !zone) throw new Error('Нет зоны')
      return setZoneWeighingCompleted({ tournamentId, zone, completed })
    },
    onSuccess: async () => {
      if (tournamentId) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.zoneJudges(tournamentId) })
      }
    },
  })

  const saveMutation = useMutation({
    mutationFn: (input: {
      grams: number
      entryId: string
      rosterMemberId: string
      miniTourId: string
    }) => {
      if (closed) throw new Error('Турнир завершён')
      if (weighingDone) throw new Error('Взвешивание зоны завершено — нажмите «Продолжить взвешивание»')
      return addCatch({
        entryId: input.entryId,
        rosterMemberId: input.rosterMemberId,
        miniTourId: input.miniTourId,
        weightGrams: input.grams,
        userId: user!.id,
        tournamentId,
      })
    },
    onMutate: async () => {
      if (!tournamentId) return
      await queryClient.cancelQueries({ queryKey: tournamentKeys.catches(tournamentId) })
    },
    onSuccess: (row) => {
      if (tournamentId) {
        queryClient.setQueryData<CatchRow[]>(tournamentKeys.catches(tournamentId), (prev) => {
          const list = prev ?? []
          if (list.some((c) => c.id === row.id)) return list
          return [row, ...list]
        })
      }
      setFailedSave(null)
      setSavedNote(true)
      setEditingMemberId(null)
    },
    onError: (_error, input) => {
      setSavedNote(false)
      setFailedSave(input)
    },
  })

  useEffect(() => {
    if (!savedNote) return
    const timer = window.setTimeout(() => setSavedNote(false), 2500)
    return () => window.clearTimeout(timer)
  }, [savedNote])

  const deleteMutation = useMutation({
    mutationFn: (catchId: string) => deleteCatch(catchId),
    onSuccess: invalidate,
  })

  const goToPanel = (next: Panel) => {
    setPanel(next)
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: next === 'results' ? el.clientWidth : 0, behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = scrollerRef.current
    if (!el || swipeLocked) return
    const next: Panel = el.scrollLeft > el.clientWidth * 0.45 ? 'results' : 'console'
    setPanel(next)
  }

  useEffect(() => {
    if (swipeLocked) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: panel === 'results' ? el.clientWidth : 0, behavior: 'auto' })
  }, [swipeLocked, panel])

  if (!isOrg && zoneJudgesPending && !assignedZone) {
    return (
      <Text size="sm" c="dimmed" p="md">
        Загрузка зоны…
      </Text>
    )
  }

  if (myZones.length === 0) {
    return (
      <EmptyState
        title="Пульт судьи"
        description="Вас ещё не назначили на зону этого турнира. Попросите организатора добавить вас в «Судьи зон»."
      />
    )
  }

  const tourOptions = format.tours.map((t) => ({
    value: String(t.number),
    label: t.number === 1 ? 'I тур' : t.number === 2 ? 'II тур' : `Тур ${t.number}`,
  }))

  return (
    <div className={`pc-judge-console ${swipeLocked ? 'pc-judge-console--locked' : ''}`}>
      <Stack gap="sm" className="pc-judge-console-header">
        {closed && (
          <Text size="sm" c="dimmed">
            Турнир завершён. Взвешивание закрыто до перезапуска.
          </Text>
        )}
        {tournament.map_mode === 'geo' && tournament.venue_map && (
          <Stack gap={6}>
            <Button size="compact-xs" variant="light" onClick={() => setShowVenueMap((v) => !v)}>
              {showVenueMap ? 'Скрыть карту площадки' : 'Карта площадки'}
            </Button>
            {showVenueMap && <VenueMapView venueMap={tournament.venue_map} height={220} />}
          </Stack>
        )}
        {fishingDone && !closed && (
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Text size="sm" c={weighingDone ? 'teal' : 'dimmed'}>
              {weighingDone
                ? `Зона ${zone}: взвешивание отмечено как завершённое`
                : 'Ловля окончена — вес пишется в последний мини-тур'}
            </Text>
            <Button
              size="compact-sm"
              color={weighingDone ? 'gray' : 'signal'}
              variant={weighingDone ? 'light' : 'filled'}
              loading={weighDoneMutation.isPending}
              disabled={!zone}
              onClick={() => {
                if (!weighingDone) {
                  if (!window.confirm(`Отметить взвешивание зоны ${zone} как завершённое?`)) return
                }
                setEditingMemberId(null)
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
        {failedSave && !editingMemberId && (
          <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
            <Text size="sm" c="red">
              Не записано {failedSave.grams.toLocaleString('ru-RU')} г
            </Text>
            <Button
              size="compact-xs"
              color="signal"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(failedSave)}
            >
              Повторить
            </Button>
          </Group>
        )}
        {savedNote && !failedSave && (
          <Text size="sm" c="dimmed">
            Записано
          </Text>
        )}
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap="xs">
            <Badge color={zone === 'A' ? 'zoneA' : 'zoneB'} size="lg" variant="filled">
              Зона {zone}
            </Badge>
            <Badge variant="outline" color="gray" className="pc-tabular">
              {weighedCount}/{athletes.length}
            </Badge>
          </Group>
          <Group gap="xs">
            <Button
              size="compact-xs"
              variant="light"
              color="signal"
              loading={refreshing}
              onClick={() => void refresh()}
            >
              Обновить
            </Button>
            <SegmentedControl
              size="xs"
              value={String(tourNumber)}
              onChange={(v) => setManualTour(Number(v))}
              data={tourOptions}
            />
          </Group>
        </Group>
        {mapWindow && (
          <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
            <Text size="sm" fw={700} lineClamp={1}>
              {mapWindow.label}
            </Text>
            {minutesLeft != null && (
              <Text className="pc-tabular" fw={800} c="signal" style={{ flexShrink: 0 }}>
                {minutesLeft} мин
              </Text>
            )}
          </Group>
        )}
        {(tournament.schedule_paused_at || tournament.schedule_delay_minutes > 0) && (
          <Text size="xs" c="dimmed">
            {tournament.schedule_paused_at ? 'Пауза' : null}
            {tournament.schedule_paused_at && tournament.schedule_delay_minutes > 0 ? ' · ' : null}
            {tournament.schedule_delay_minutes > 0 ? `+${tournament.schedule_delay_minutes} мин` : null}
          </Text>
        )}
        <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
          <Text size="xs" c={weighLabel ? undefined : 'dimmed'} lineClamp={2}>
            {weighLabel ? `Запишется в ${weighLabel}` : 'Сейчас некуда записать улов'}
          </Text>
          <Button
            size="compact-xs"
            variant={stepState.back ? 'filled' : 'default'}
            color={stepState.back ? 'signal' : undefined}
            disabled={!canStepBack}
            onClick={() => setStepState({ key: clockKey, back: !stepState.back })}
            style={{ flexShrink: 0 }}
          >
            это ещё прошлый
          </Button>
        </Group>

        {myZones.length > 1 && (
          <SegmentedControl
            fullWidth
            value={zone ?? undefined}
            onChange={(v) => setOrgZone(v as ZoneCode)}
            data={myZones.map((z) => ({ value: z, label: `Зона ${z}` }))}
            color={zone === 'A' ? 'zoneA' : 'zoneB'}
          />
        )}

        <Group gap={8} justify="center">
          <UnstyledButton
            className={`pc-judge-tab ${panel === 'console' ? 'pc-judge-tab--active' : ''}`}
            onClick={() => goToPanel('console')}
          >
            Пульт
          </UnstyledButton>
          <Text c="dimmed" size="sm">
            ·
          </Text>
          <UnstyledButton
            className={`pc-judge-tab ${panel === 'results' ? 'pc-judge-tab--active' : ''}`}
            onClick={() => goToPanel('results')}
          >
            Результаты
          </UnstyledButton>
        </Group>
      </Stack>

      <div
        ref={scrollerRef}
        className="pc-judge-swipe"
        onScroll={onScroll}
        style={{ overflowX: swipeLocked ? 'hidden' : undefined }}
      >
        <section className="pc-judge-panel">
          <Stack gap="sm" h="100%">
            <TextInput
              placeholder="Поиск спортсмена"
              leftSection={<IconSearch size={18} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="md"
            />
            <div className="pc-judge-team-grid">
              {athletes.length === 0 ? (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                  {weighTarget.slot
                    ? `Нет спортсменов в зоне ${zone} на этот мини-тур`
                    : 'Сейчас некуда записать улов'}
                </Text>
              ) : (
                athletes.map((row) => (
                  <UnstyledButton
                    key={row.member.id}
                    className={`pc-judge-team-btn ${row.weight > 0 ? 'pc-judge-team-btn--done' : ''}`}
                    onClick={() => {
                      if (!inputLocked) setEditingMemberId(row.member.id)
                    }}
                  >
                    <Text fw={800} size="md" lineClamp={2} ta="center">
                      {row.member.full_name_snapshot}
                      {row.member.is_junior ? ' · Юн.' : ''}
                    </Text>
                    <Text size="xs" c="dimmed" ta="center" mt={2} lineClamp={1}>
                      {row.teamName} · сектор {row.sector || '—'}
                    </Text>
                    <Text
                      className="pc-tabular"
                      size="sm"
                      c={row.weight > 0 ? 'signal' : 'dimmed'}
                      mt={4}
                      ta="center"
                    >
                      {row.weight > 0
                        ? `${row.weight} г${row.rows.length > 1 ? ` · ${row.rows.length}` : ''}`
                        : '—'}
                    </Text>
                  </UnstyledButton>
                ))
              )}
            </div>
          </Stack>
        </section>

        <section className="pc-judge-panel">
          <Stack gap="sm" h="100%">
            <Text fw={700} size="sm" c="dimmed">
              Вводы зоны {zone}
              {weighTarget.slot ? ` · ${slotTitle(weighTarget.slot)}` : ''}
            </Text>
            {deleteMutation.isError && (
              <Text c="red" size="sm">
                {(deleteMutation.error as Error).message}
              </Text>
            )}
            {resultGroups.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                Пока нет записанных весов
              </Text>
            ) : (
              <Stack gap="sm" className="pc-judge-results-list">
                {resultGroups.map((row) => (
                  <Stack key={row.member.id} gap={6}>
                    <Group justify="space-between" wrap="nowrap" gap="xs">
                      <UnstyledButton
                        style={{ minWidth: 0, flex: 1, textAlign: 'left' }}
                        onClick={() => {
                          if (inputLocked) return
                          goToPanel('console')
                          setEditingMemberId(row.member.id)
                        }}
                      >
                        <Text fw={700} lineClamp={1}>
                          {row.member.full_name_snapshot}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {row.teamName} · сектор {row.sector || '—'}
                        </Text>
                      </UnstyledButton>
                      <Text fw={800} className="pc-tabular" size="lg">
                        {row.weight} г
                      </Text>
                    </Group>
                    {row.rows.map((catchRow) => {
                      const authorName =
                        (catchRow.created_by && authors?.get(catchRow.created_by)?.full_name) ||
                        (catchRow.created_by ? catchRow.created_by.slice(0, 8) : '—')
                      return (
                        <div key={catchRow.id} className="pc-judge-result-row">
                          <div className="pc-judge-result-main">
                            <Text size="xs" c="dimmed">
                              {formatLogTime(catchRow.created_at)}
                              {' · '}
                              {authorName}
                            </Text>
                          </div>
                          <Text fw={700} className="pc-tabular">
                            {catchRow.weight_grams}
                          </Text>
                          <Button
                            size="compact-sm"
                            color="red"
                            variant="subtle"
                            disabled={inputLocked}
                            loading={deleteMutation.isPending && deleteMutation.variables === catchRow.id}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  `Удалить фиксацию «${row.member.full_name_snapshot}» (${catchRow.weight_grams} г)? Сумма пересчитается.`,
                                )
                              ) {
                                return
                              }
                              deleteMutation.mutate(catchRow.id)
                            }}
                          >
                            Удал.
                          </Button>
                        </div>
                      )
                    })}
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </section>
      </div>

      {editing && user && !inputLocked && (
        <WeightNumpad
          key={editing.member.id}
          subjectName={editing.member.full_name_snapshot}
          recordedGrams={editingWeight}
          targetLabel={weighLabel}
          saving={saveMutation.isPending}
          error={saveMutation.isError ? (saveMutation.error as Error).message : null}
          onSave={(grams) => {
            if (!weighMiniId) return
            saveMutation.mutate({
              grams,
              entryId: editing.entry.id,
              rosterMemberId: editing.member.id,
              miniTourId: weighMiniId,
            })
          }}
          onClose={() => {
            saveMutation.reset()
            setEditingMemberId(null)
          }}
        />
      )}
    </div>
  )
}
