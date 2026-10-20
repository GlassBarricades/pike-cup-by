import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActionIcon, Badge, Button, Group, SegmentedControl, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import { IconArrowLeft, IconBackspace, IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { addCatch, deleteCatch } from '../../features/tournament/api'
import { tournamentKeys, useCatchAuthors, useCatches, useEntries, useMiniTours, useSegments, useTournamentRealtime, useZoneJudges } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import {
    getCurrentPhase,
    physicalZone,
    previousFishingSlot,
    resolveMapWindow,
    resolveWeighTarget,
    slotTitle,
    tourNumberFromPhase,
} from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import { entryTeamName, type CatchRow, type MiniTour, type ZoneCode } from '../../features/tournament/types'
import { EmptyState } from '../../ui'

type Panel = 'console' | 'results'

function tourWeight(entryId: string, tourNumber: 1 | 2, catches: CatchRow[], miniTours: MiniTour[]): number {
    const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
    return catches.filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id)).reduce((sum, c) => sum + c.weight_grams, 0)
}

function tourCatches(entryId: string, tourNumber: 1 | 2, catches: CatchRow[], miniTours: MiniTour[]): CatchRow[] {
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

function WeightNumpad({
    teamName,
    recordedGrams,
    targetLabel,
    saving,
    error,
    onSave,
    onClose,
}: {
    teamName: string
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

    const backspace = () => {
        if (saving) return
        setDigits((prev) => prev.slice(0, -1))
    }
    const clear = () => {
        if (saving) return
        setDigits('')
    }

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const

    return (
        <div className="pc-judge-numpad-overlay" role="dialog" aria-label="Ввод веса">
            <Stack gap="md" className="pc-judge-numpad" p="md">
                <Group justify="space-between" align="flex-start">
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                            Новое взвешивание
                        </Text>
                        <Text fw={800} size="lg" lineClamp={2}>
                            {teamName}
                        </Text>
                    </div>
                    <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} disabled={saving} aria-label="Назад">
                        <IconArrowLeft size={22} />
                    </ActionIcon>
                </Group>

                <Text size="sm" ta="center" c={targetLabel ? undefined : 'dimmed'}>
                    {targetLabel ? `Запишется в ${targetLabel}` : 'Сейчас некуда записать улов'}
                </Text>

                <Text className="pc-judge-weight-display pc-tabular" ta="center">
                    {digits || '0'}
                    <Text span size="sm" c="dimmed" ml={6}>
                        г
                    </Text>
                </Text>
                {recordedGrams > 0 && (
                    <Text size="sm" c="dimmed" ta="center">
                        Уже записано {recordedGrams} г — эта фиксация прибавится к сумме
                    </Text>
                )}

                <div className="pc-judge-keypad">
                    {keys.map((k) => {
                        if (k === 'clear') {
                            return (
                                <UnstyledButton key={k} className="pc-judge-key pc-judge-key-muted" onClick={clear}>
                                    C
                                </UnstyledButton>
                            )
                        }
                        if (k === 'back') {
                            return (
                                <UnstyledButton key={k} className="pc-judge-key pc-judge-key-muted" onClick={backspace} aria-label="Стереть">
                                    <IconBackspace size={28} />
                                </UnstyledButton>
                            )
                        }
                        return (
                            <UnstyledButton key={k} className="pc-judge-key" onClick={() => press(k)}>
                                {k}
                            </UnstyledButton>
                        )
                    })}
                </div>

                {error && (
                    <Text c="red" size="sm" ta="center">
                        {error}
                    </Text>
                )}

                <Button
                    color="signal"
                    size="xl"
                    h={56}
                    disabled={!canSave || saving || !targetLabel}
                    loading={saving}
                    loaderProps={{ color: 'white', type: 'oval' }}
                    onClick={() => onSave(value)}
                >
                    {saving ? 'Сохранение' : 'Записать'}
                </Button>

                <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>
                    Назад
                </Button>
            </Stack>
        </div>
    )
}

export function ConsoleScreen() {
    const { user, role } = useAuth()
    const isOrg = canManageTournament(role)
    const { selected: tournament } = useStaffTournament()
    const tournamentId = tournament?.id
    const now = useNow()

    const { data: entries = [] } = useEntries(tournamentId)
    const { data: miniTours = [] } = useMiniTours(tournamentId)
    const { data: catches = [] } = useCatches(tournamentId)
    const { data: segments = [] } = useSegments(tournamentId)
    const { data: zoneJudges = [] } = useZoneJudges(tournamentId)
    const { data: authors } = useCatchAuthors(catches)

    useTournamentRealtime(tournamentId)

    const queryClient = useQueryClient()
    const scrollerRef = useRef<HTMLDivElement>(null)

    const myAssignment = useMemo(() => zoneJudges.find((j) => j.user_id === user?.id) ?? null, [zoneJudges, user?.id])

    const [orgZone, setOrgZone] = useState<ZoneCode>('A')
    const zone: ZoneCode | null = isOrg ? orgZone : (myAssignment?.zone ?? null)

    const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
    const scheduleTour = tourNumberFromPhase(phase)
    const [manualTour, setManualTour] = useState<1 | 2 | null>(null)
    const tourNumber: 1 | 2 = manualTour ?? scheduleTour ?? 1

    useEffect(() => {
        if (scheduleTour) setManualTour(null)
    }, [scheduleTour])

    const [panel, setPanel] = useState<Panel>('console')
    const [search, setSearch] = useState('')
    const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
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

    const saveMutation = useMutation({
        mutationFn: (grams: number) => {
            if (!weighMiniId) throw new Error('Сейчас некуда записать улов')
            return addCatch({
                entryId: editingEntryId!,
                miniTourId: weighMiniId,
                weightGrams: grams,
                userId: user!.id,
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
            setEditingEntryId(null)
        },
    })

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

    if (!tournament) {
        return <EmptyState title="Пульт судьи" description="Выберите турнир сверху." />
    }

    if (!isOrg && !myAssignment) {
        return <EmptyState title="Пульт судьи" description="Вас ещё не назначили на зону этого турнира. Попросите организатора добавить вас в «Судьи зон»." />
    }

    return (
        <div className={`pc-judge-console ${swipeLocked ? 'pc-judge-console--locked' : ''}`}>
            <Stack gap="sm" className="pc-judge-console-header">
                <Group justify="space-between" align="center" wrap="wrap" gap="xs">
                    <Group gap="xs">
                        <Badge color={zone === 'A' ? 'zoneA' : 'zoneB'} size="lg" variant="filled">
                            Зона {zone}
                        </Badge>
                        <Badge variant="outline" color="gray" className="pc-tabular">
                            {weighedCount}/{zoneEntries.length}
                        </Badge>
                    </Group>
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

                {isOrg && (
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
                                            onClick={() => setEditingEntryId(entry.id)}
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

            {editingEntry && user && (
                <WeightNumpad
                    key={editingEntry.id}
                    teamName={entryTeamName(editingEntry)}
                    recordedGrams={editingWeight}
                    targetLabel={weighLabel}
                    saving={saveMutation.isPending}
                    error={saveMutation.isError ? (saveMutation.error as Error).message : null}
                    onSave={(grams) => saveMutation.mutate(grams)}
                    onClose={() => {
                        saveMutation.reset()
                        setEditingEntryId(null)
                    }}
                />
            )}
        </div>
    )
}
