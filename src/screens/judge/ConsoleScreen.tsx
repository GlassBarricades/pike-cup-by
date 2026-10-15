import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { IconArrowLeft, IconBackspace, IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { deleteTourWeight, upsertTourWeight } from '../../features/tournament/api'
import {
  tournamentKeys,
  useCatchAuthors,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournamentRealtime,
  useZoneJudges,
} from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import {
  getCurrentPhase,
  physicalZone,
  tourNumberFromSegmentKey,
} from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import {
  entryTeamName,
  type CatchRow,
  type MiniTour,
  type ZoneCode,
} from '../../features/tournament/types'
import { EmptyState } from '../../ui'

type Panel = 'console' | 'results'

function tourWeight(
  entryId: string,
  tourNumber: 1 | 2,
  catches: CatchRow[],
  miniTours: MiniTour[],
): number {
  const miniIds = new Set(
    miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id),
  )
  return catches
    .filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id))
    .reduce((sum, c) => sum + c.weight_grams, 0)
}

function tourCatchMeta(
  entryId: string,
  tourNumber: 1 | 2,
  catches: CatchRow[],
  miniTours: MiniTour[],
): { weight: number; createdAt: string | null; createdBy: string | null } {
  const miniIds = new Set(
    miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id),
  )
  const rows = catches
    .filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const weight = rows.reduce((sum, c) => sum + c.weight_grams, 0)
  const latest = rows[0]
  return {
    weight,
    createdAt: latest?.created_at ?? null,
    createdBy: latest?.created_by ?? null,
  }
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
  initialWeight,
  hasExisting,
  saving,
  deleting,
  error,
  onSave,
  onDelete,
  onClose,
}: {
  teamName: string
  initialWeight: number
  hasExisting: boolean
  saving: boolean
  deleting: boolean
  error: string | null
  onSave: (grams: number) => void
  onDelete: () => void
  onClose: () => void
}) {
  const [digits, setDigits] = useState(() =>
    initialWeight > 0 ? String(initialWeight) : '',
  )

  const value = Number(digits) || 0
  const canSave = value > 0

  const press = (d: string) => {
    setDigits((prev) => {
      if (prev.length >= 6) return prev
      if (prev === '0') return d
      return prev + d
    })
  }

  const backspace = () => setDigits((prev) => prev.slice(0, -1))
  const clear = () => setDigits('')

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const

  return (
    <div className="pc-judge-numpad-overlay" role="dialog" aria-label="Ввод веса">
      <Stack gap="md" className="pc-judge-numpad" p="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              {hasExisting ? 'Изменить вес' : 'Вес команды'}
            </Text>
            <Text fw={800} size="lg" lineClamp={2}>
              {teamName}
            </Text>
          </div>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} aria-label="Назад">
            <IconArrowLeft size={22} />
          </ActionIcon>
        </Group>

        <Text className="pc-judge-weight-display pc-tabular" ta="center">
          {digits || '0'}
          <Text span size="sm" c="dimmed" ml={6}>
            г
          </Text>
        </Text>

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
                <UnstyledButton
                  key={k}
                  className="pc-judge-key pc-judge-key-muted"
                  onClick={backspace}
                  aria-label="Стереть"
                >
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
          disabled={!canSave}
          loading={saving}
          onClick={() => onSave(value)}
        >
          Сохранить
        </Button>

        {hasExisting && (
          <Button
            color="red"
            variant="light"
            size="lg"
            h={48}
            loading={deleting}
            onClick={() => {
              if (!window.confirm(`Удалить вес «${teamName}»?`)) return
              onDelete()
            }}
          >
            Удалить
          </Button>
        )}

        <Button variant="subtle" color="gray" onClick={onClose}>
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

  const myAssignment = useMemo(
    () => zoneJudges.find((j) => j.user_id === user?.id) ?? null,
    [zoneJudges, user?.id],
  )

  const [orgZone, setOrgZone] = useState<ZoneCode>('A')
  const zone: ZoneCode | null = isOrg ? orgZone : (myAssignment?.zone ?? null)

  const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
  const scheduleTour = tourNumberFromSegmentKey(phase?.segment?.key)
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
    () =>
      zoneEntries.filter((e) => tourWeight(e.id, tourNumber, catches, miniTours) > 0).length,
    [zoneEntries, tourNumber, catches, miniTours],
  )

  const resultRows = useMemo(() => {
    return zoneEntries
      .map((entry) => {
        const meta = tourCatchMeta(entry.id, tourNumber, catches, miniTours)
        return { entry, ...meta }
      })
      .filter((r) => r.weight > 0)
      .sort((a, b) => entryTeamName(a.entry).localeCompare(entryTeamName(b.entry), 'ru'))
  }, [zoneEntries, tourNumber, catches, miniTours])

  const editingEntry = entries.find((e) => e.id === editingEntryId)
  const editingWeight = editingEntry
    ? tourWeight(editingEntry.id, tourNumber, catches, miniTours)
    : 0

  const invalidate = useCallback(async () => {
    if (tournamentId) {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournamentId) })
    }
  }, [queryClient, tournamentId])

  const saveMutation = useMutation({
    mutationFn: (grams: number) =>
      upsertTourWeight({
        entryId: editingEntryId!,
        tournamentId: tournamentId!,
        tourNumber,
        weightGrams: grams,
        userId: user!.id,
      }),
    onSuccess: async () => {
      setEditingEntryId(null)
      await invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await deleteTourWeight({
        entryId,
        tournamentId: tournamentId!,
        tourNumber,
      })
    },
    onSuccess: async () => {
      setEditingEntryId(null)
      await invalidate()
    },
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
    return (
      <EmptyState
        title="Пульт судьи"
        description="Выберите турнир сверху."
      />
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
                  const w = tourWeight(entry.id, tourNumber, catches, miniTours)
                  return (
                    <UnstyledButton
                      key={entry.id}
                      className={`pc-judge-team-btn ${w > 0 ? 'pc-judge-team-btn--done' : ''}`}
                      onClick={() => setEditingEntryId(entry.id)}
                    >
                      <Text fw={800} size="md" lineClamp={2} ta="center">
                        {entryTeamName(entry)}
                      </Text>
                      <Text
                        className="pc-tabular"
                        size="sm"
                        c={w > 0 ? 'signal' : 'dimmed'}
                        mt={4}
                      >
                        {w > 0 ? `${w} г` : '—'}
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
            {resultRows.length === 0 ? (
              <Text c="dimmed" size="sm" ta="center" py="xl">
                Пока нет записанных весов
              </Text>
            ) : (
              <Stack gap="xs" className="pc-judge-results-list">
                {resultRows.map(({ entry, weight, createdAt, createdBy }) => {
                  const authorName =
                    (createdBy && authors?.get(createdBy)?.full_name) ||
                    (createdBy ? createdBy.slice(0, 8) : '—')
                  return (
                    <div key={entry.id} className="pc-judge-result-row">
                      <UnstyledButton
                        className="pc-judge-result-main"
                        onClick={() => {
                          goToPanel('console')
                          setEditingEntryId(entry.id)
                        }}
                      >
                        <Text fw={700} lineClamp={1}>
                          {entryTeamName(entry)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {createdAt ? formatLogTime(createdAt) : '—'} · {authorName}
                        </Text>
                      </UnstyledButton>
                      <Text fw={800} className="pc-tabular" size="lg">
                        {weight}
                      </Text>
                      <Button
                        size="compact-sm"
                        color="red"
                        variant="subtle"
                        loading={
                          deleteMutation.isPending && deleteMutation.variables === entry.id
                        }
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Удалить вес «${entryTeamName(entry)}» (${weight} г)?`,
                            )
                          ) {
                            return
                          }
                          deleteMutation.mutate(entry.id)
                        }}
                      >
                        Удал.
                      </Button>
                    </div>
                  )
                })}
              </Stack>
            )}
          </Stack>
        </section>
      </div>

      {editingEntry && user && (
        <WeightNumpad
          teamName={entryTeamName(editingEntry)}
          initialWeight={editingWeight}
          hasExisting={editingWeight > 0}
          saving={saveMutation.isPending}
          deleting={deleteMutation.isPending}
          error={
            saveMutation.isError
              ? (saveMutation.error as Error).message
              : deleteMutation.isError
                ? (deleteMutation.error as Error).message
                : null
          }
          onSave={(grams) => saveMutation.mutate(grams)}
          onDelete={() => deleteMutation.mutate(editingEntry.id)}
          onClose={() => {
            saveMutation.reset()
            deleteMutation.reset()
            setEditingEntryId(null)
          }}
        />
      )}
    </div>
  )
}
