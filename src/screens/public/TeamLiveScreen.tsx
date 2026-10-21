import { useEffect, useMemo, useState } from 'react'
import { Anchor, Button, Group, Stack, Text, Title } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { buildCatchLog, formatCatchClock } from '../../features/tournament/catchLog'
import { clearCheer, readCheer, writeCheer } from '../../features/tournament/cheer'
import { useCatches, useEntries, useMiniTours, useSegments, useTournament, useTournamentRealtime } from '../../features/tournament/hooks'
import { clockWeighSlot, getCurrentPhase, physicalZone, resolveMapWindow, slotTitle, teamMarkers, tourNumberFromPhase } from '../../features/tournament/schedule'
import { computeStandings, formatPlace, type StandingRow } from '../../features/tournament/scoring'
import { formatSlipCode } from '../../features/tournament/slips'
import { entryTeamName, type ZoneCode } from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'
import { LakeBoard, Panel } from '../../ui'

function grams(value: number): string {
    return `${value.toLocaleString('ru-RU')} г`
}

function tourHasCatch(
    start: ZoneCode,
    tour: 1 | 2,
    entries: { id: string; start_zone: ZoneCode | null }[],
    catches: { entry_id: string; mini_tour_id: string }[],
    miniTours: { id: string; tour_number: number }[]
): boolean {
    const startOf = new Map(entries.map((entry) => [entry.id, entry.start_zone]))
    const tourOf = new Map(miniTours.map((mini) => [mini.id, mini.tour_number]))
    return catches.some((row) => startOf.get(row.entry_id) === start && tourOf.get(row.mini_tour_id) === tour)
}

export function TeamLiveScreen() {
    const { tournamentId, entryId } = useParams()
    const { data: tournament, isLoading } = useTournament(tournamentId)
    const { data: entries = [] } = useEntries(tournament?.id)
    const { data: catches = [] } = useCatches(tournament?.id)
    const { data: miniTours = [] } = useMiniTours(tournament?.id)
    const { data: segments = [] } = useSegments(tournament?.id)
    useTournamentRealtime(tournament?.id)
    const now = useNow(1_000)

    const entry = entries.find((item) => item.id === entryId)
    const storedCheer = Boolean(tournament && entry && readCheer(tournament.id) === entry.id)
    const [cheerState, setCheerState] = useState<{ entryId: string; on: boolean } | null>(null)
    const cheering = cheerState != null && cheerState.entryId === entry?.id ? cheerState.on : storedCheer

    const phase = tournament && tournament.status !== 'finished' ? getCurrentPhase(tournament, segments, now) : null
    const mapWindow = tournament ? resolveMapWindow(tournament, segments, now) : null
    const marker = entry && mapWindow ? (teamMarkers([entry], mapWindow)[0] ?? null) : null
    const slot = mapWindow ? clockWeighSlot(mapWindow, segments, phase?.kind ?? (tournament?.status === 'finished' ? 'after' : null)) : null

    const standings = useMemo(
        () =>
            tournament
                ? computeStandings(entries, catches, miniTours, {
                      zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
                  })
                : [],
        [tournament, entries, catches, miniTours]
    )
    const standing = standings.find((row) => row.entryId === entry?.id)
    const log = useMemo(() => buildCatchLog(entries, catches, miniTours).filter((row) => row.entryId === entryId), [entries, catches, miniTours, entryId])
    const logKey = log.map((row) => row.id).join('|')
    const [seenLog, setSeenLog] = useState<string | null>(null)
    const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
    if (entry && seenLog !== logKey) {
        const previous = new Set((seenLog ?? '').split('|').filter(Boolean))
        const added = seenLog == null ? [] : logKey.split('|').filter((id) => id && !previous.has(id))
        setSeenLog(logKey)
        if (added.length > 0) setFlashIds(new Set(added))
    }
    useEffect(() => {
        if (flashIds.size === 0) return
        const timer = window.setTimeout(() => setFlashIds(new Set()), 1600)
        return () => window.clearTimeout(timer)
    }, [flashIds])

    if (isLoading) return <Text c="dimmed">Загрузка…</Text>
    if (!tournament) return <Text>Турнир не найден</Text>
    if (!entry) return <Text>Команда в этом турнире не найдена</Text>

    const liveTour = tourNumberFromPhase(phase)
    const shownTour: 1 | 2 = liveTour ?? 1
    const shore = physicalZone(entry.start_zone, shownTour)
    const otherTour: 1 | 2 = shownTour === 1 ? 2 : 1
    const otherShore = physicalZone(entry.start_zone, otherTour)
    const start = entry.start_zone
    const shoreOpen = start ? tourHasCatch(start, shownTour, entries, catches, miniTours) : false
    const otherOpen = start ? tourHasCatch(start, otherTour, entries, catches, miniTours) : false
    const placeOf = (row: StandingRow, zone: ZoneCode | null) => (zone === 'B' ? row.zoneBPlace : row.zoneAPlace)
    const weightOf = (row: StandingRow, zone: ZoneCode | null) => (zone === 'B' ? row.zoneBWeight : row.zoneAWeight)
    const shorePlace = standing && shoreOpen ? placeOf(standing, shore) : null
    const otherPlace = standing && otherOpen ? placeOf(standing, otherShore) : null
    const sum = shoreOpen && otherOpen && standing ? standing.placeSum : null
    const miniRows = slot ? log.filter((row) => row.tour === slot.tour && row.mini === slot.mini) : []
    const miniWeight = miniRows.reduce((sumGrams, row) => sumGrams + row.grams, 0)

    let ahead: StandingRow | null = null
    let behind: StandingRow | null = null
    if (standing?.startZone && shoreOpen && shore) {
        const group = standings
            .filter((row) => row.startZone === standing.startZone)
            .sort((a, b) => placeOf(a, shore) - placeOf(b, shore) || weightOf(b, shore) - weightOf(a, shore))
        const index = group.findIndex((row) => row.entryId === standing.entryId)
        ahead = index > 0 ? group[index - 1] : null
        behind = group[index + 1] ?? null
    }

    return (
        <Stack gap="lg">
            <Anchor component={Link} to={`/tournament/${tournament.id}?tab=teams`} size="sm" c="dimmed">
                ← {tournament.name}
            </Anchor>
            <div>
                <Title order={2}>{entryTeamName(entry)}</Title>
                <Text size="sm" c="dimmed">
                    {(entry.roster ?? []).map((member) => member.full_name_snapshot).join(' · ') || 'Состав не указан'}
                    {entry.draw_slip ? ` · бумажка ${formatSlipCode(entry.draw_slip.code)}` : ''}
                    {entry.start_zone ? ` · старт ${entry.start_zone}` : ''}
                </Text>
            </div>

            <Panel p="sm">
                <Text fw={700}>{marker ? `Зона ${marker.zone} · сектор ${marker.sector}` : mapWindow?.label}</Text>
                <Text size="sm" c="dimmed">
                    {marker ? (marker.state === 'moving' ? 'Идёт по берегу' : 'Ловит') : 'Сейчас не на берегу'}
                </Text>
            </Panel>

            <LakeBoard tournament={tournament} segments={segments} entries={entries} catches={catches} miniTours={miniTours} onlyEntryId={entry.id} />

            <Group grow align="stretch">
                <Panel p="sm">
                    <Text size="xs" c="dimmed" tt="uppercase">
                        {slot ? slotTitle(slot) : 'Мини-тур'}
                    </Text>
                    <Text className="pc-display" c="var(--pc-signal)" style={{ fontSize: '1.6rem' }}>
                        {slot && miniRows.length > 0 ? grams(miniWeight) : 'Ещё не взвешена'}
                    </Text>
                </Panel>
                <Panel p="sm">
                    <Text size="xs" c="dimmed" tt="uppercase">
                        {shore ? `Зона ${shore}` : 'Зона'}
                    </Text>
                    <Text className="pc-display" style={{ fontSize: '1.6rem' }}>
                        {shorePlace == null ? '—' : formatPlace(shorePlace)}
                    </Text>
                    <Text size="sm" className="pc-tabular">
                        {standing && shore ? grams(weightOf(standing, shore)) : '0 г'}
                    </Text>
                </Panel>
                <Panel p="sm">
                    <Text size="xs" c="dimmed" tt="uppercase">
                        {otherShore ? `Зона ${otherShore}` : 'Вторая зона'}
                    </Text>
                    <Text className="pc-display" style={{ fontSize: '1.6rem' }}>
                        {otherPlace == null ? '—' : formatPlace(otherPlace)}
                    </Text>
                    <Text size="sm" className="pc-tabular">
                        {standing && otherShore ? grams(weightOf(standing, otherShore)) : '0 г'}
                    </Text>
                </Panel>
                <Panel p="sm">
                    <Text size="xs" c="dimmed" tt="uppercase">
                        Сумма мест
                    </Text>
                    <Text className="pc-display" style={{ fontSize: '1.6rem' }}>
                        {sum == null ? '—' : formatPlace(sum)}
                    </Text>
                    <Text size="sm" className="pc-tabular">
                        {standing ? grams(standing.totalWeight) : '0 г'}
                    </Text>
                </Panel>
            </Group>

            {ahead || behind ? (
                <Text size="sm">
                    {ahead ? `Впереди ${ahead.teamName}, ${grams(weightOf(ahead, shore))}` : 'Впереди никого'}
                    {' · '}
                    {behind ? `позади ${behind.teamName}, ${grams(weightOf(behind, shore))}` : 'позади никого'}
                </Text>
            ) : null}

            <Group gap="xs">
                <Button
                    size="xs"
                    variant={cheering ? 'filled' : 'light'}
                    color={cheering ? 'signal' : undefined}
                    onClick={() => {
                        if (cheering) {
                            clearCheer()
                            setCheerState({ entryId: entry.id, on: false })
                            return
                        }
                        writeCheer(tournament.id, entry.id)
                        setCheerState({ entryId: entry.id, on: true })
                    }}
                >
                    {cheering ? 'Хватит болеть' : 'Болею за них'}
                </Button>
                {entry.team_id ? (
                    <Button component={Link} to={`/teams/${entry.team_id}`} size="xs" variant="default">
                        О команде
                    </Button>
                ) : null}
            </Group>

            <Stack gap="xs">
                <Text fw={700}>Уловы</Text>
                {log.length === 0 ? (
                    <Text size="sm" c="dimmed">
                        Пока нет фиксаций
                    </Text>
                ) : (
                    log.map((row) => (
                        <Group
                            key={row.id}
                            justify="space-between"
                            className={flashIds.has(row.id) ? 'pc-peg-flash' : undefined}
                            p="xs"
                            style={{ borderBottom: '1px solid var(--pc-line)' }}
                        >
                            <Text size="sm">
                                {formatCatchClock(row.createdAt)}
                                {row.tour && row.mini ? ` · ${slotTitle({ tour: row.tour, mini: row.mini })}` : ''}
                                {row.zone ? ` · зона ${row.zone}` : ''}
                                {row.sector != null ? ` · сектор ${row.sector}` : ''}
                            </Text>
                            <Text fw={700} className="pc-tabular">
                                {grams(row.grams)}
                            </Text>
                        </Group>
                    ))
                )}
            </Stack>
        </Stack>
    )
}
