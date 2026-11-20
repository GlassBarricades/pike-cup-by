import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Group, SegmentedControl, Select, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { addCatch, deleteCatch, isZoneWeighingCompleted, setZoneWeighingCompleted } from '../../features/tournament/api'
import { getFormat, isIndividual } from '../../features/tournament/formats'
import { formatTournamentDate, statusLabel } from '../../features/tournament/date'
import {
    tournamentKeys,
    useCatchAuthors,
    useCatches,
    useEntries,
    useMiniTours,
    useMyZoneAssignments,
    useRefreshTournament,
    useSegments,
    useTournaments,
    useZoneJudges,
} from '../../features/tournament/hooks'
import { IndividualConsole } from './IndividualConsole'
import { WeightNumpad } from './WeightNumpad'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import {
    getCurrentPhase,
    isFishingComplete,
    physicalZone,
    previousFishingSlot,
    resolveMapWindow,
    resolveWeighTarget,
    slotTitle,
    tourNumberFromPhase,
} from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import {
    entryTeamName,
    type CatchRow,
    type MiniTour,
    type Tournament,
    type ZoneCode,
    type ZoneJudgeAssignment,
} from '../../features/tournament/types'
import { EmptyState, VenueMapView } from '../../ui'

type Panel = 'console' | 'results'

const CONSOLE_TOURNAMENT_KEY = 'pikecup.judgeConsoleTournamentId'

function readConsoleTournamentId(): string | null {
    try {
        return sessionStorage.getItem(CONSOLE_TOURNAMENT_KEY)
    } catch {
        return null
    }
}

function writeConsoleTournamentId(id: string | null) {
    try {
        if (id) sessionStorage.setItem(CONSOLE_TOURNAMENT_KEY, id)
        else sessionStorage.removeItem(CONSOLE_TOURNAMENT_KEY)
    } catch {
        /* ignore */
    }
}

function tourWeight(entryId: string, tourNumber: number, catches: CatchRow[], miniTours: MiniTour[]): number {
    const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
    return catches.filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id)).reduce((sum, c) => sum + c.weight_grams, 0)
}

function tourCatches(entryId: string, tourNumber: number, catches: CatchRow[], miniTours: MiniTour[]): CatchRow[] {
    const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
    return catches.filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id)).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

function formatLogTime(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function ConsoleScreen() {
    const { user, role, loading: authLoading } = useAuth()
    const isOrg = canManageTournament(role)
    const {
        data: assignments = [],
        isPending: assignmentsPending,
        isFetched: assignmentsFetched,
    } = useMyZoneAssignments(user?.id)
    const needsOrgFallback = Boolean(isOrg && assignmentsFetched && assignments.length === 0)
    const { data: allTournaments = [], isPending: tournamentsPending } = useTournaments(
        undefined,
        Boolean(isOrg),
    )
    const [pickedId, setPickedId] = useState<string | null>(() => readConsoleTournamentId())

    const orgOptions = useMemo(
        () => allTournaments.filter((t) => t.status === 'live' || t.status === 'published'),
        [allTournaments],
    )

    const pickTournament = useCallback((id: string) => {
        setPickedId(id)
        writeConsoleTournamentId(id)
    }, [])

    const assignmentByTournament = useMemo(() => {
        const map = new Map<string, ZoneJudgeAssignment>()
        for (const row of assignments) map.set(row.tournament_id, row)
        return map
    }, [assignments])

    const selectable = useMemo(() => {
        if (assignments.length > 0) {
            return assignments.map((a) => ({
                id: a.tournament_id,
                label: `${formatTournamentDate(a.tournament.event_date)} · ${a.tournament.name} · зона ${a.zone}`,
                tournament: a.tournament,
                zone: a.zone as ZoneCode | null,
            }))
        }
        return orgOptions.map((t) => ({
            id: t.id,
            label: `${formatTournamentDate(t.event_date)} · ${t.name} (${statusLabel[t.status]})`,
            tournament: t,
            zone: null as ZoneCode | null,
        }))
    }, [assignments, orgOptions])

    const activeId =
        (pickedId && selectable.some((s) => s.id === pickedId) ? pickedId : null) ??
        selectable[0]?.id ??
        null
    const active = selectable.find((s) => s.id === activeId) ?? null

    useEffect(() => {
        if (active && pickedId !== active.id) {
            writeConsoleTournamentId(active.id)
        }
    }, [active, pickedId])

    const loading =
        authLoading || !user || assignmentsPending || (needsOrgFallback && tournamentsPending)

    if (loading) {
        return (
            <Text size="sm" c="dimmed" p="md">
                Загрузка пульта…
            </Text>
        )
    }

    if (!isOrg && assignments.length === 0) {
        return (
            <EmptyState
                title="Пульт судьи"
                description="Вас ещё не назначили на зону ни в одном текущем турнире. Попросите организатора добавить вас в «Судьи зон»."
            />
        )
    }

    if (isOrg && assignments.length === 0 && orgOptions.length === 0) {
        return (
            <EmptyState
                title="Пульт судьи"
                description="Нет опубликованных или идущих турниров."
            />
        )
    }

    if (!active) {
        return (
            <EmptyState title="Пульт судьи" description="Нет доступных турниров для пульта." />
        )
    }

    const assignedZone =
        assignmentByTournament.get(active.id)?.zone ?? active.zone

    return (
        <Stack gap="sm">
            {selectable.length > 1 && (
                <Select
                    label="Турнир"
                    data={selectable.map((s) => ({ value: s.id, label: s.label }))}
                    value={active.id}
                    onChange={(v) => {
                        if (v) pickTournament(v)
                    }}
                    searchable
                    size="sm"
                />
            )}
            {isIndividual(getFormat(active.tournament)) ? (
                <IndividualConsole tournament={active.tournament} assignedZone={assignedZone} />
            ) : (
                <PikecupConsole tournament={active.tournament} assignedZone={assignedZone} />
            )}
        </Stack>
    )
}

function PikecupConsole({
    tournament,
    assignedZone,
}: {
    tournament: Tournament
    assignedZone: ZoneCode | null
}) {
    const { user, role } = useAuth()
    const isOrg = canManageTournament(role)
    const closed = useTournamentDayClosed(tournament)
    const tournamentId = tournament.id
    const now = useNow()

    const { data: entries = [] } = useEntries(tournamentId)
    const { data: miniTours = [] } = useMiniTours(tournamentId)
    const { data: catches = [] } = useCatches(tournamentId)
    const { data: segments = [] } = useSegments(tournamentId)
    const { data: zoneJudges = [], isPending: zoneJudgesPending } = useZoneJudges(tournamentId)
    const { data: authors } = useCatchAuthors(catches)
    const { refresh, isFetching: refreshing } = useRefreshTournament(tournamentId)

    const queryClient = useQueryClient()
    const scrollerRef = useRef<HTMLDivElement>(null)

    const myAssignment = useMemo(
        () =>
            assignedZone
                ? ({ zone: assignedZone } as { zone: ZoneCode })
                : (zoneJudges.find((j) => j.user_id === user?.id) ?? null),
        [assignedZone, zoneJudges, user?.id],
    )

    const [orgZone, setOrgZone] = useState<ZoneCode>('A')
    const zone: ZoneCode | null = myAssignment?.zone ?? (isOrg ? orgZone : null)
    const showOrgZonePicker = isOrg && !myAssignment?.zone

    const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
    const scheduleTour = tourNumberFromPhase(phase)
    const [manualTour, setManualTour] = useState<number | null>(null)
    const tourNumber: number = manualTour ?? scheduleTour ?? 1

    useEffect(() => {
        if (scheduleTour) setManualTour(null)
    }, [scheduleTour])

    const [panel, setPanel] = useState<Panel>('console')
    const [search, setSearch] = useState('')
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
    const [failedSave, setFailedSave] = useState<{ grams: number; entryId: string; miniTourId: string } | null>(null)
    const [savedNote, setSavedNote] = useState(false)
    const [showVenueMap, setShowVenueMap] = useState(false)
    const swipeLocked = Boolean(editingEntryId)

    const zoneEntries = useMemo(() => {
        const needle = search.trim().toLocaleLowerCase('ru')
        return entries
            .filter((e) => physicalZone(e.start_zone, tourNumber) === zone)
            .filter((e) => {
                if (!needle) return true
                return entryTeamName(e).toLocaleLowerCase('ru').includes(needle)
            })
            .sort((a, b) => entryTeamName(a).localeCompare(entryTeamName(b), 'ru'))
    }, [entries, tourNumber, zone, search])

    const weighedCount = useMemo(
        () => zoneEntries.filter((e) => tourWeight(e.id, tourNumber, catches, miniTours) > 0).length,
        [zoneEntries, tourNumber, catches, miniTours]
    )

    const resultGroups = useMemo(() => {
        return zoneEntries
            .map((entry) => {
                const rows = tourCatches(entry.id, tourNumber, catches, miniTours)
                const weight = rows.reduce((sum, c) => sum + c.weight_grams, 0)
                return { entry, rows, weight }
            })
            .filter((r) => r.rows.length > 0)
            .sort((a, b) => entryTeamName(a.entry).localeCompare(entryTeamName(b.entry), 'ru'))
    }, [zoneEntries, tourNumber, catches, miniTours])

    const editingEntry = entries.find((e) => e.id === editingEntryId)
    const editingRows = editingEntry ? tourCatches(editingEntry.id, tourNumber, catches, miniTours) : []
    const editingWeight = editingRows.reduce((sum, c) => sum + c.weight_grams, 0)

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
    const weighMiniId =
        weighTarget.slot == null
            ? null
            : (miniTours.find((mini) => mini.tour_number === weighTarget.slot?.tour && mini.mini_number === weighTarget.slot?.mini)?.id ?? null)
    const weighLabel = weighTarget.slot ? `${slotTitle(weighTarget.slot)}${weighTarget.note ? ` · ${weighTarget.note}` : ''}` : null
    const msLeft = phase?.endsAtEffective != null ? Math.max(0, phase.endsAtEffective.getTime() - phase.effectiveNow.getTime()) : null
    const minutesLeft = msLeft != null && (phase?.kind === 'active' || phase?.kind === 'gap') ? Math.ceil(msLeft / 60_000) : null

    const invalidate = useCallback(async () => {
        if (tournamentId) {
            await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournamentId) })
        }
    }, [queryClient, tournamentId])

    const fishingDone = tournament ? isFishingComplete(tournament, segments, now) : false
    const weighingDone = isZoneWeighingCompleted(zoneJudges, zone)
    const inputLocked = closed || weighingDone

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
        mutationFn: (input: { grams: number; entryId: string; miniTourId: string }) => {
            if (closed) throw new Error('Турнир завершён')
            if (weighingDone) throw new Error('Взвешивание зоны завершено — нажмите «Продолжить взвешивание»')
            return addCatch({
                entryId: input.entryId,
                miniTourId: input.miniTourId,
                weightGrams: input.grams,
                userId: user!.id,
                tournamentId: tournamentId,
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
            setEditingEntryId(null)
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

    if (!isOrg && !assignedZone && zoneJudgesPending) {
        return (
            <Text size="sm" c="dimmed" p="md">
                Загрузка зоны…
            </Text>
        )
    }

    if (!isOrg && !myAssignment) {
        return (
            <EmptyState
                title="Пульт судьи"
                description="Вас ещё не назначили на зону этого турнира. Попросите организатора добавить вас в «Судьи зон»."
            />
        )
    }

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
                        <Button
                            size="compact-xs"
                            variant="light"
                            onClick={() => setShowVenueMap((v) => !v)}
                        >
                            {showVenueMap ? 'Скрыть карту площадки' : 'Карта площадки'}
                        </Button>
                        {showVenueMap && (
                            <VenueMapView venueMap={tournament.venue_map} height={220} />
                        )}
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
                                setEditingEntryId(null)
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
                {failedSave && !editingEntryId && (
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
                            {weighedCount}/{zoneEntries.length}
                        </Badge>
                    </Group>
                    <Group gap="xs">
                        <Button size="compact-xs" variant="light" color="signal" loading={refreshing} onClick={() => void refresh()}>
                            Обновить
                        </Button>
                        <SegmentedControl
                            size="xs"
                            value={String(tourNumber)}
                            onChange={(v) => setManualTour(Number(v) as 1 | 2)}
                            data={[
                                { value: '1', label: 'I тур' },
                                { value: '2', label: 'II тур' },
                            ]}
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

                {showOrgZonePicker && (
                    <SegmentedControl
                        fullWidth
                        value={orgZone}
                        onChange={(v) => setOrgZone(v as ZoneCode)}
                        data={[
                            { value: 'A', label: 'Зона A' },
                            { value: 'B', label: 'Зона B' },
                        ]}
                        color={orgZone === 'A' ? 'zoneA' : 'zoneB'}
                    />
                )}

                <Group gap={8} justify="center">
                    <UnstyledButton className={`pc-judge-tab ${panel === 'console' ? 'pc-judge-tab--active' : ''}`} onClick={() => goToPanel('console')}>
                        Пульт
                    </UnstyledButton>
                    <Text c="dimmed" size="sm">
                        ·
                    </Text>
                    <UnstyledButton className={`pc-judge-tab ${panel === 'results' ? 'pc-judge-tab--active' : ''}`} onClick={() => goToPanel('results')}>
                        Результаты
                    </UnstyledButton>
                </Group>
            </Stack>

            <div ref={scrollerRef} className="pc-judge-swipe" onScroll={onScroll} style={{ overflowX: swipeLocked ? 'hidden' : undefined }}>
                <section className="pc-judge-panel">
                    <Stack gap="sm" h="100%">
                        <TextInput
                            placeholder="Поиск команды"
                            leftSection={<IconSearch size={18} />}
                            value={search}
                            onChange={(e) => setSearch(e.currentTarget.value)}
                            size="md"
                        />
                        <div className="pc-judge-team-grid">
                            {zoneEntries.length === 0 ? (
                                <Text c="dimmed" size="sm" ta="center" py="xl">
                                    Нет команд в зоне {zone} для этого тура
                                </Text>
                            ) : (
                                zoneEntries.map((entry) => {
                                    const rows = tourCatches(entry.id, tourNumber, catches, miniTours)
                                    const w = rows.reduce((sum, c) => sum + c.weight_grams, 0)
                                    return (
                                        <UnstyledButton
                                            key={entry.id}
                                            className={`pc-judge-team-btn ${w > 0 ? 'pc-judge-team-btn--done' : ''}`}
                                            onClick={() => {
                                                if (!inputLocked) setEditingEntryId(entry.id)
                                            }}
                                        >
                                            <Text fw={800} size="md" lineClamp={2} ta="center">
                                                {entryTeamName(entry)}
                                            </Text>
                                            <Text className="pc-tabular" size="sm" c={w > 0 ? 'signal' : 'dimmed'} mt={4}>
                                                {w > 0 ? `${w} г${rows.length > 1 ? ` · ${rows.length}` : ''}` : '—'}
                                            </Text>
                                        </UnstyledButton>
                                    )
                                })
                            )}
                        </div>
                    </Stack>
                </section>

                <section className="pc-judge-panel">
                    <Stack gap="sm" h="100%">
                        <Text fw={700} size="sm" c="dimmed">
                            Вводы зоны {zone} · {tourNumber === 1 ? 'I' : 'II'} тур
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
                                {resultGroups.map(({ entry, rows, weight }) => (
                                    <Stack key={entry.id} gap={6}>
                                        <Group justify="space-between" wrap="nowrap" gap="xs">
                                            <UnstyledButton
                                                style={{ minWidth: 0, flex: 1, textAlign: 'left' }}
                                                onClick={() => {
                                                    if (inputLocked) return
                                                    goToPanel('console')
                                                    setEditingEntryId(entry.id)
                                                }}
                                            >
                                                <Text fw={700} lineClamp={1}>
                                                    {entryTeamName(entry)}
                                                </Text>
                                            </UnstyledButton>
                                            <Text fw={800} className="pc-tabular" size="lg">
                                                {weight} г
                                            </Text>
                                        </Group>
                                        {rows.map((row) => {
                                            const authorName =
                                                (row.created_by && authors?.get(row.created_by)?.full_name) || (row.created_by ? row.created_by.slice(0, 8) : '—')
                                            const mini = miniTours.find((item) => item.id === row.mini_tour_id)
                                            return (
                                                <div key={row.id} className="pc-judge-result-row">
                                                    <div className="pc-judge-result-main">
                                                        <Text size="xs" c="dimmed">
                                                            {formatLogTime(row.created_at)}
                                                            {mini ? ` · мини-тур ${mini.mini_number}` : ''}
                                                            {' · '}
                                                            {authorName}
                                                        </Text>
                                                    </div>
                                                    <Text fw={700} className="pc-tabular">
                                                        {row.weight_grams}
                                                    </Text>
                                                    <Button
                                                        size="compact-sm"
                                                        color="red"
                                                        variant="subtle"
                                                        disabled={inputLocked}
                                                        loading={deleteMutation.isPending && deleteMutation.variables === row.id}
                                                        onClick={() => {
                                                            if (
                                                                !window.confirm(
                                                                    `Удалить фиксацию «${entryTeamName(entry)}» (${row.weight_grams} г)? Сумма пересчитается.`
                                                                )
                                                            ) {
                                                                return
                                                            }
                                                            deleteMutation.mutate(row.id)
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

            {editingEntry && user && !inputLocked && (
                <WeightNumpad
                    key={editingEntry.id}
                    subjectName={entryTeamName(editingEntry)}
                    recordedGrams={editingWeight}
                    targetLabel={weighLabel}
                    saving={saveMutation.isPending}
                    error={saveMutation.isError ? (saveMutation.error as Error).message : null}
                    onSave={(grams) => {
                        if (!editingEntryId || !weighMiniId) return
                        saveMutation.mutate({ grams, entryId: editingEntryId, miniTourId: weighMiniId })
                    }}
                    onClose={() => {
                        saveMutation.reset()
                        setEditingEntryId(null)
                    }}
                />
            )}
        </div>
    )
}
