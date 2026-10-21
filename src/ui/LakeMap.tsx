import { Box, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ISLAND_PATH, LAKE_FRAME, LAKE_LABELS, LAKE_READING, LAKE_VIEW, WATER_PATH, markerPosition, outward, sectorPoints } from '../features/tournament/lake'
import { resolveMapWindow, teamMarkers, type MapWindow, type TeamMarker } from '../features/tournament/schedule'
import { computeStandings, formatPlace, type StandingRow } from '../features/tournament/scoring'
import { formatSlipCode } from '../features/tournament/slips'
import { clearCheer, readCheer, writeCheer } from '../features/tournament/cheer'
import { buildCatchLog } from '../features/tournament/catchLog'
import type { CatchRow, MiniTour, ScheduleSegment, Tournament, TournamentEntry, ZoneCode } from '../features/tournament/types'
import { useNow } from '../features/tournament/useNow'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'

/** Пикселей берега на 100%. У зоны A 35 секторов через ~14 единиц — около 48 px между метками. */
const SHORE_PX = 3.4
const MAX_ZOOM = 4.5
const ZOOM_STEP = 1.35
const READABLE_ZOOM = 1
const FOCUS_ZOOM = 1.5
const CATCH_ZOOM = 2.2
const GLIDE_MS = 700
const OWN_HOLD_MS = 4500
const OTHER_HOLD_MS = 2800

type CatchSpot = {
    id: string
    entryId: string
    grams: number
    teamName: string
    zone: ZoneCode | null
    sector: number | null
}

function readableCamera(): Camera {
    return { cx: LAKE_READING.x, cy: LAKE_READING.y, zoom: READABLE_ZOOM }
}

function fitZoom(width: number, height: number): number {
    if (width < 40 || height < 40) return 0.25
    return Math.min(width / (SHORE_PX * LAKE_FRAME.width), height / (SHORE_PX * LAKE_FRAME.height))
}

export type MapSpectator = {
    entryId: string
    teamId: string | null
    teamName: string
    rosterNames: string[]
    slipCode: string | null
    finalPlace: number | null
    placeSum: number | null
    zoneAWeight: number
    zoneBWeight: number
    totalWeight: number
    miniGrams: number | null
}

function shortName(name: string): string {
    const trimmed = name.trim()
    if (trimmed.length <= 16) return trimmed
    return `${trimmed.slice(0, 15)}…`
}

function zoneColor(zone: ZoneCode): string {
    return zone === 'A' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'
}

type Camera = { cx: number; cy: number; zoom: number }

function screenPx(base: number, zoom: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, base * Math.sqrt(zoom)))
}

function pxPerWorld(zoom: number): number {
    return SHORE_PX * zoom
}

function clampCamera(camera: Camera, width: number, height: number): Camera {
    const zoom = Math.min(MAX_ZOOM, Math.max(fitZoom(width, height), camera.zoom))
    const scale = pxPerWorld(zoom)
    const worldW = width / scale
    const worldH = height / scale
    const cx = worldW >= LAKE_VIEW.width ? LAKE_VIEW.width / 2 : Math.min(LAKE_VIEW.width - worldW / 2, Math.max(worldW / 2, camera.cx))
    const cy = worldH >= LAKE_VIEW.height ? LAKE_VIEW.height / 2 : Math.min(LAKE_VIEW.height - worldH / 2, Math.max(worldH / 2, camera.cy))
    return { cx, cy, zoom }
}

function labelBox(
    marker: TeamMarker,
    scale: number,
    zoom: number,
    slot: number,
    stand: { x: number; y: number }
): { x: number; y: number; w: number; h: number; anchor: { x: number; y: number }; font: number } | null {
    const text = shortName(marker.teamName)
    const font = screenPx(13, zoom, 12, 16) / scale
    const ring = screenPx([26, 46, 68][slot] ?? 26, zoom, 20, 72) / scale
    const anchor = outward(stand, marker.state === 'moving' ? ring * 0.75 : ring)
    const w = text.length * font * 0.62
    const h = font * 1.35
    return { x: anchor.x - w / 2, y: anchor.y - h / 2, w, h, anchor, font }
}

function boxesOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }, scale: number): boolean {
    const pad = 4 / scale
    return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y
}

function grams(value: number): string {
    return `${value.toLocaleString('ru-RU')} г`
}

function pegRadius(scale: number, zoom: number): number {
    return screenPx(3.2, zoom, 2.4, 4.5) / scale
}

function SectorPegs({ zone, occupied, scale, zoom }: { zone: ZoneCode; occupied: Set<number>; scale: number; zoom: number }) {
    const radius = pegRadius(scale, zoom)
    const font = screenPx(9, zoom, 7, 12) / scale
    const ring = radius + screenPx(11, zoom, 9, 14) / scale
    const halo = screenPx(2.4, zoom, 1.6, 3) / scale
    return sectorPoints(zone).map((point, index) => {
        const sector = index + 1
        const taken = occupied.has(sector)
        const label = outward(point, -ring)
        return (
            <g key={`${zone}-${sector}`}>
                <circle cx={point.x} cy={point.y} r={radius} fill={zoneColor(zone)} opacity={taken ? 1 : 0.85} />
                <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--pc-text)"
                    stroke="var(--pc-panel)"
                    strokeWidth={halo}
                    paintOrder="stroke"
                    fontSize={font}
                    style={{ fontFamily: 'var(--pc-font-body)', pointerEvents: 'none' }}
                >
                    {sector}
                </text>
            </g>
        )
    })
}

/** Ближний зазор до соседнего сектора. Кружки крупнее зазора уводим через один подальше от воды. */
function sectorGap(zone: ZoneCode, sector: number): number {
    const points = sectorPoints(zone)
    const index = sector - 1
    const point = points[index]
    if (!point) return 40
    const gaps: number[] = []
    if (index > 0) gaps.push(Math.hypot(point.x - points[index - 1].x, point.y - points[index - 1].y))
    if (index < points.length - 1) gaps.push(Math.hypot(points[index + 1].x - point.x, points[index + 1].y - point.y))
    return gaps.length > 0 ? Math.min(...gaps) : 40
}

function markerBadge(marker: TeamMarker, scale: number, zoom: number, emphasis: boolean, crowded: boolean) {
    const at = markerPosition(marker)
    if (!at) return null
    const radius = screenPx(emphasis ? 12 : 10, zoom, 8, 15) / scale
    const pad = screenPx(5, zoom, 4, 7) / scale
    const stagger = crowded && marker.state !== 'moving' && radius * 2 > sectorGap(marker.zone, marker.sector) * 0.9 && marker.sector % 2 === 1
    const lift = radius + pad + (stagger ? radius * 2 + pad : 0)
    return { at, stand: outward(at, lift), radius }
}

function TeamMark({
    marker,
    spectator,
    selected,
    leader,
    cheered,
    spot,
    labelSlot,
    crowded,
    scale,
    zoom,
    onSelect,
}: {
    marker: TeamMarker
    spectator: MapSpectator | undefined
    selected: boolean
    leader: boolean
    cheered: boolean
    spot: CatchSpot | null
    labelSlot: number | null
    crowded: boolean
    scale: number
    zoom: number
    onSelect: (entryId: string) => void
}) {
    const emphasis = selected || cheered || leader || Boolean(spot)
    const badge = markerBadge(marker, scale, zoom, emphasis, crowded)
    if (!badge) return null
    const { at, stand, radius } = badge
    const label = spot || labelSlot == null ? null : labelBox(marker, scale, zoom, labelSlot, stand)
    const stroke = screenPx(emphasis ? 2.4 : 1.6, zoom, 1.4, 3) / scale
    const callout = spot ? outward(stand, radius + screenPx(28, zoom, 22, 36) / scale) : null
    const calloutWeight = screenPx(18, zoom, 15, 22) / scale
    const calloutName = screenPx(13, zoom, 12, 16) / scale
    const halo = screenPx(4, zoom, 3, 5) / scale
    const place = spectator?.finalPlace
    const caption = place != null ? formatPlace(place) : String(marker.sector)
    const font = radius * (caption.length >= 2 ? 0.68 : 0.82)
    const stem = outward(at, pegRadius(scale, zoom))

    return (
        <g data-entry={marker.entryId}>
            <line
                x1={stem.x}
                y1={stem.y}
                x2={stand.x}
                y2={stand.y}
                stroke={zoneColor(marker.zone)}
                strokeWidth={screenPx(1.4, zoom, 1, 2) / scale}
                opacity={0.85}
                style={{ pointerEvents: 'none' }}
            />
            <g
                role="button"
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                onClick={(event) => {
                    event.stopPropagation()
                    onSelect(marker.entryId)
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelect(marker.entryId)
                    }
                }}
            >
                {spot ? <circle cx={stand.x} cy={stand.y} r={radius * 1.7} className="pc-catch-ring" fill="none" stroke="var(--pc-signal)" strokeWidth={stroke} /> : null}
                <circle
                    cx={stand.x}
                    cy={stand.y}
                    r={radius}
                    fill={zoneColor(marker.zone)}
                    stroke={spot || cheered || leader ? 'var(--pc-signal)' : 'var(--pc-panel)'}
                    strokeWidth={stroke}
                />
                <text
                    x={stand.x}
                    y={stand.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--pc-panel)"
                    fontSize={font}
                    fontWeight={700}
                    style={{ fontFamily: 'var(--pc-font-display)', pointerEvents: 'none' }}
                >
                    {caption}
                </text>
            </g>
            {callout && spot ? (
                <g style={{ pointerEvents: 'none' }}>
                    <text
                        x={callout.x}
                        y={callout.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="var(--pc-signal)"
                        stroke="var(--pc-panel)"
                        strokeWidth={halo}
                        paintOrder="stroke"
                        fontSize={calloutWeight}
                        fontWeight={700}
                        style={{ fontFamily: 'var(--pc-font-display)' }}
                    >
                        {grams(spot.grams)}
                    </text>
                    <text
                        x={callout.x}
                        y={callout.y + calloutName * 1.15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="var(--pc-text)"
                        stroke="var(--pc-panel)"
                        strokeWidth={halo}
                        paintOrder="stroke"
                        fontSize={calloutName}
                        fontWeight={700}
                        style={{ fontFamily: 'var(--pc-font-body)' }}
                    >
                        {shortName(marker.teamName)}
                    </text>
                </g>
            ) : null}
            {label ? (
                <text
                    x={label.anchor.x}
                    y={label.anchor.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="var(--pc-text)"
                    stroke="var(--pc-panel)"
                    strokeWidth={screenPx(3, zoom, 2, 4) / scale}
                    paintOrder="stroke"
                    fontSize={label.font}
                    fontWeight={700}
                    style={{ fontFamily: 'var(--pc-font-body)', pointerEvents: 'none' }}
                >
                    {shortName(marker.teamName)}
                </text>
            ) : null}
        </g>
    )
}

function ResultCard({
    spectator,
    marker,
    miniTitle,
    cheering,
    tournamentId,
    onCheer,
    onClose,
}: {
    spectator: MapSpectator
    marker: TeamMarker | null
    miniTitle: string | null
    cheering: boolean
    tournamentId: string
    onCheer: () => void
    onClose: () => void
}) {
    return (
        <Panel p="sm" style={{ boxShadow: '0 16px 40px color-mix(in srgb, black 55%, transparent)' }}>
            <Stack gap="sm">
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                    <div>
                        <Text fw={700}>{spectator.teamName}</Text>
                        {spectator.rosterNames.length > 0 ? (
                            <Text size="xs" c="dimmed">
                                {spectator.rosterNames.join(' · ')}
                            </Text>
                        ) : null}
                    </div>
                    <Button size="xs" variant="subtle" aria-label="Закрыть" onClick={onClose}>
                        ×
                    </Button>
                </Group>
                {marker ? (
                    <Text size="sm">
                        Зона {marker.zone} · сектор {marker.sector} · {marker.state === 'moving' ? 'идёт по берегу' : 'ловит'}
                        {spectator.slipCode ? ` · бумажка ${formatSlipCode(spectator.slipCode)}` : ''}
                    </Text>
                ) : (
                    <Text size="sm" c="dimmed">
                        Сейчас не на воде
                        {spectator.slipCode ? ` · бумажка ${formatSlipCode(spectator.slipCode)}` : ''}
                    </Text>
                )}
                {miniTitle ? (
                    <div>
                        <Text size="xs" c="dimmed" tt="uppercase" className="pc-display">
                            {miniTitle}
                        </Text>
                        <Text className="pc-tabular" fw={700}>
                            {spectator.miniGrams == null ? 'Ещё не взвешена' : grams(spectator.miniGrams)}
                        </Text>
                    </div>
                ) : null}
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" className="pc-display">
                        Соревнование
                    </Text>
                    <Text size="sm">
                        Место {spectator.finalPlace == null ? '—' : formatPlace(spectator.finalPlace)}
                        {spectator.placeSum == null ? '' : ` · сумма мест ${formatPlace(spectator.placeSum)}`}
                    </Text>
                    <Text size="sm" className="pc-tabular">
                        A {grams(spectator.zoneAWeight)} · B {grams(spectator.zoneBWeight)} · всего {grams(spectator.totalWeight)}
                    </Text>
                </div>
                <Group gap="xs">
                    {spectator.teamId || tournamentId ? (
                        <Button component={Link} to={`/tournament/${tournamentId}/team/${spectator.entryId}`} size="xs" variant="light">
                            Карточка команды
                        </Button>
                    ) : null}
                    <Button size="xs" variant={cheering ? 'filled' : 'light'} color={cheering ? 'signal' : undefined} onClick={onCheer}>
                        {cheering ? 'Хватит болеть' : 'Болею за них'}
                    </Button>
                </Group>
            </Stack>
        </Panel>
    )
}

export function LakeMap({
    title,
    markers,
    spectators,
    leaders,
    arrival,
    followCatches = false,
    miniTitle,
    note,
    tournamentId,
    soloEntryId,
}: {
    title: string
    markers: TeamMarker[]
    spectators: MapSpectator[]
    leaders: MapSpectator[]
    arrival: CatchSpot | null
    followCatches?: boolean
    miniTitle: string | null
    note?: string
    tournamentId: string
    soloEntryId?: string
}) {
    const frameRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<HTMLDivElement>(null)
    const sizeRef = useRef({ w: 360, h: 386 })
    const home = soloEntryId ? { cx: LAKE_READING.x, cy: LAKE_READING.y, zoom: FOCUS_ZOOM } : readableCamera()
    const cameraRef = useRef<Camera>(home)
    const dragRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)
    const pointersRef = useRef(new Map<number, { x: number; y: number }>())
    const pinchRef = useRef<{ distance: number; zoom: number; worldX: number; worldY: number } | null>(null)
    const movedRef = useRef(false)
    const glideToken = useRef(0)
    const glidingRef = useRef(false)
    const markersRef = useRef(markers)
    const queuedRef = useRef<CatchSpot | null>(null)
    const cheerIdRef = useRef<string | null>(null)
    const driveRef = useRef<'auto' | 'hand'>(followCatches ? 'auto' : 'hand')
    const storedCheer = soloEntryId ? null : readCheer(tournamentId)
    const [camera, setCamera] = useState<Camera>(home)
    const [stageSize, setStageSize] = useState({ w: 360, h: 386 })
    const [zoneFilter, setZoneFilter] = useState<'all' | ZoneCode>('all')
    const [query, setQuery] = useState('')
    const [cheerId, setCheerId] = useState<string | null>(storedCheer)
    const [selectedId, setSelectedId] = useState<string | null>(storedCheer)
    const [tracking, setTracking] = useState(Boolean(soloEntryId) || storedCheer != null)
    const [showTags, setShowTags] = useState(false)
    const [fullscreen, setFullscreen] = useState<'off' | 'native' | 'page'>('off')
    const [drive, setDrive] = useState<'auto' | 'hand'>(followCatches ? 'auto' : 'hand')
    const [heldId, setHeldId] = useState<string | null>(null)
    const [spotlight, setSpotlight] = useState<CatchSpot | null>(null)
    const [queued, setQueued] = useState<CatchSpot | null>(null)
    const [seenArrivalId, setSeenArrivalId] = useState<string | null>(null)
    const phase = spotlight ? 'spot' : 'rest'
    if (arrival && arrival.id !== seenArrivalId) {
        setSeenArrivalId(arrival.id)
        if (spotlight && cheerId && spotlight.entryId === cheerId && arrival.entryId !== cheerId) {
            setQueued(arrival)
        } else {
            setQueued(null)
            setSpotlight(arrival)
            if (followCatches && drive === 'auto') setZoneFilter('all')
        }
    }

    const byId = useMemo(() => new Map(spectators.map((row) => [row.entryId, row])), [spectators])
    const visibleMarkers = markers.filter((marker) => zoneFilter === 'all' || marker.zone === zoneFilter)
    const selectedMarker = markers.find((marker) => marker.entryId === selectedId) ?? null
    const selected = selectedId ? (byId.get(selectedId) ?? null) : null
    const occupied = {
        A: new Set(visibleMarkers.filter((marker) => marker.zone === 'A').map((marker) => marker.sector)),
        B: new Set(visibleMarkers.filter((marker) => marker.zone === 'B').map((marker) => marker.sector)),
    }
    const suggestions = query.trim() ? spectators.filter((row) => row.teamName.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))).slice(0, 6) : []
    const scale = pxPerWorld(camera.zoom)
    const worldW = stageSize.w / scale
    const worldH = stageSize.h / scale
    const viewBox = `${camera.cx - worldW / 2} ${camera.cy - worldH / 2} ${worldW} ${worldH}`

    function commit(next: Camera) {
        const clamped = clampCamera(next, sizeRef.current.w, sizeRef.current.h)
        cameraRef.current = clamped
        setCamera(clamped)
    }

    function worldAt(clientX: number, clientY: number): { x: number; y: number; px: number; py: number } | null {
        const el = stageRef.current
        if (!el) return null
        const { w, h } = sizeRef.current
        const cam = cameraRef.current
        const current = pxPerWorld(cam.zoom)
        const rect = el.getBoundingClientRect()
        const px = clientX - rect.left
        const py = clientY - rect.top
        return {
            x: cam.cx - w / current / 2 + px / current,
            y: cam.cy - h / current / 2 + py / current,
            px,
            py,
        }
    }

    function lookAt(worldX: number, worldY: number, zoom: number, clientX?: number, clientY?: number) {
        const el = stageRef.current
        const { w, h } = sizeRef.current
        const rect = el?.getBoundingClientRect()
        const px = clientX != null && rect ? clientX - rect.left : w / 2
        const py = clientY != null && rect ? clientY - rect.top : h / 2
        const nextScale = pxPerWorld(zoom)
        commit({
            cx: worldX - px / nextScale + w / nextScale / 2,
            cy: worldY - py / nextScale + h / nextScale / 2,
            zoom,
        })
    }

    function cancelGlide() {
        glideToken.current += 1
        glidingRef.current = false
    }

    function glideTo(target: Camera) {
        const from = cameraRef.current
        const next = clampCamera(target, sizeRef.current.w, sizeRef.current.h)
        const same = Math.abs(from.cx - next.cx) < 0.5 && Math.abs(from.cy - next.cy) < 0.5 && Math.abs(from.zoom - next.zoom) < 0.02
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (same) {
            cancelGlide()
            return
        }
        if (reduced) {
            cancelGlide()
            commit(next)
            return
        }
        const token = ++glideToken.current
        glidingRef.current = true
        let start = 0
        const step = (now: number) => {
            if (glideToken.current !== token) return
            if (start === 0) start = now
            const t = Math.min(1, (now - start) / GLIDE_MS)
            const eased = 1 - (1 - t) ** 3
            commit({
                cx: from.cx + (next.cx - from.cx) * eased,
                cy: from.cy + (next.cy - from.cy) * eased,
                zoom: from.zoom + (next.zoom - from.zoom) * eased,
            })
            if (t < 1) {
                requestAnimationFrame(step)
                return
            }
            glidingRef.current = false
        }
        requestAnimationFrame(step)
    }

    function markerFrame(entryId: string, zoom: number): Camera | null {
        const marker = markersRef.current.find((item) => item.entryId === entryId)
        const at = marker ? markerPosition(marker) : null
        if (!at) return null
        return { cx: at.x, cy: at.y, zoom }
    }

    function takeHand() {
        cancelGlide()
        if (!followCatches || soloEntryId) return
        setDrive('hand')
        setTracking(false)
        setHeldId(null)
    }

    function focusEntry(entryId: string) {
        cancelGlide()
        setSelectedId(entryId)
        setHeldId(drive === 'auto' ? entryId : null)
        setQuery('')
        setZoneFilter('all')
        const marker = markers.find((item) => item.entryId === entryId)
        const at = marker ? markerPosition(marker) : null
        if (!at) return
        setTracking(entryId === cheerId || entryId === soloEntryId)
        lookAt(at.x, at.y, FOCUS_ZOOM)
    }

    function cheerFor(entryId: string) {
        cancelGlide()
        setCheerId(entryId)
        setHeldId(null)
        writeCheer(tournamentId, entryId)
        setTracking(true)
        setSelectedId(entryId)
        setQuery('')
        const marker = markers.find((item) => item.entryId === entryId)
        const at = marker ? markerPosition(marker) : null
        if (at) lookAt(at.x, at.y, FOCUS_ZOOM)
    }

    function stopCheer() {
        setCheerId(null)
        clearCheer()
        setTracking(false)
    }

    function fitLake() {
        takeHand()
        setTracking(false)
        const { w, h } = sizeRef.current
        commit({
            cx: LAKE_FRAME.x + LAKE_FRAME.width / 2,
            cy: LAKE_FRAME.y + LAKE_FRAME.height / 2,
            zoom: fitZoom(w, h),
        })
    }

    function zoomBy(factor: number, clientX?: number, clientY?: number) {
        takeHand()
        const cam = cameraRef.current
        const point = clientX != null && clientY != null ? worldAt(clientX, clientY) : null
        if (point) {
            lookAt(point.x, point.y, cam.zoom * factor, clientX, clientY)
            return
        }
        lookAt(cam.cx, cam.cy, cam.zoom * factor)
    }

    const zoomByRef = useRef<(factor: number, clientX?: number, clientY?: number) => void>(() => {})

    useEffect(() => {
        zoomByRef.current = zoomBy
        markersRef.current = markers
        cheerIdRef.current = cheerId
        driveRef.current = drive
        queuedRef.current = queued
    })

    useEffect(() => {
        const el = stageRef.current
        if (!el) return
        const apply = () => {
            const w = el.clientWidth
            const h = el.clientHeight
            if (w < 40 || h < 40) return
            sizeRef.current = { w, h }
            setStageSize({ w, h })
            const clamped = clampCamera(cameraRef.current, w, h)
            cameraRef.current = clamped
            setCamera(clamped)
        }
        apply()
        const observer = new ResizeObserver(apply)
        observer.observe(el)
        return () => observer.disconnect()
    }, [fullscreen, soloEntryId])

    useEffect(() => {
        const sync = () => {
            setFullscreen((current) => {
                if (document.fullscreenElement === frameRef.current) return 'native'
                return current === 'native' ? 'off' : current
            })
        }
        document.addEventListener('fullscreenchange', sync)
        return () => document.removeEventListener('fullscreenchange', sync)
    }, [])

    useEffect(() => {
        if (fullscreen !== 'page') return
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setFullscreen('off')
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [fullscreen])

    async function toggleFullscreen() {
        const el = frameRef.current
        if (!el) return
        if (fullscreen === 'page') {
            setFullscreen('off')
            return
        }
        if (document.fullscreenElement === el) {
            await document.exitFullscreen()
            return
        }
        try {
            await el.requestFullscreen()
        } catch {
            setFullscreen('page')
        }
    }

    useEffect(() => {
        const el = stageRef.current
        if (!el) return
        const onWheel = (event: WheelEvent) => {
            event.preventDefault()
            const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
            zoomByRef.current(factor, event.clientX, event.clientY)
        }
        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
    }, [])

    useEffect(() => {
        if (!spotlight) return
        const own = spotlight.entryId === cheerIdRef.current
        const timer = window.setTimeout(
            () => {
                const next = queuedRef.current
                queuedRef.current = null
                setQueued(null)
                if (next) {
                    setSpotlight(next)
                    if (driveRef.current === 'auto') setZoneFilter('all')
                } else {
                    if (driveRef.current === 'auto') setHeldId(spotlight.entryId)
                    setSpotlight(null)
                }
            },
            own ? OWN_HOLD_MS : OTHER_HOLD_MS
        )
        return () => window.clearTimeout(timer)
    }, [spotlight])

    useEffect(() => {
        if (soloEntryId || drive !== 'auto' || selectedId) return
        if (spotlight) {
            const target = markerFrame(spotlight.entryId, CATCH_ZOOM)
            if (target) glideTo(target)
            return
        }
        if (heldId) return
        if (cheerId) {
            const target = markerFrame(cheerId, FOCUS_ZOOM)
            if (target) glideTo(target)
            return
        }
        glideTo(readableCamera())
    }, [spotlight, drive, selectedId, cheerId, soloEntryId, heldId])

    useEffect(() => {
        if (glidingRef.current) return
        if (!soloEntryId && drive === 'auto' && phase === 'spot') return
        const directed = !soloEntryId && drive === 'auto' && phase === 'rest' && !selectedId ? heldId : null
        const followCheer = !directed && !soloEntryId && drive === 'auto' && phase === 'rest' && !selectedId ? cheerId : null
        const followId = soloEntryId ?? directed ?? followCheer ?? (tracking ? cheerId : null)
        if (!followId) return
        const marker = markers.find((item) => item.entryId === followId)
        const at = marker ? markerPosition(marker) : null
        if (!at) return
        const cam = cameraRef.current
        if (Math.abs(cam.cx - at.x) < 0.5 && Math.abs(cam.cy - at.y) < 0.5) return
        commit(clampCamera({ ...cam, cx: at.x, cy: at.y }, sizeRef.current.w, sizeRef.current.h))
    }, [soloEntryId, tracking, cheerId, markers, drive, phase, selectedId, heldId])

    const leaderId = leaders[0]?.entryId
    const labelSlots = new Map<string, number>()
    const placedLabels: { x: number; y: number; w: number; h: number }[] = []
    const occupiedSector = (marker: TeamMarker) =>
        marker.state !== 'moving' &&
        visibleMarkers.some(
            (other) =>
                other.entryId !== marker.entryId &&
                other.state !== 'moving' &&
                other.zone === marker.zone &&
                Math.abs(other.sector - marker.sector) === 1,
        )
    const pegObstacles = visibleMarkers.flatMap((marker) => {
        const badge = markerBadge(marker, scale, camera.zoom, marker.entryId === selectedId || marker.entryId === heldId || marker.entryId === leaderId, occupiedSector(marker))
        if (!badge) return []
        const { stand, radius } = badge
        return [{ x: stand.x - radius, y: stand.y - radius, w: radius * 2, h: radius * 2 }]
    })
    const labeled = [...visibleMarkers].sort((a, b) => {
        if (a.entryId === cheerId) return -1
        if (b.entryId === cheerId) return 1
        if (a.entryId === heldId) return -1
        if (b.entryId === heldId) return 1
        if (a.entryId === selectedId) return -1
        if (b.entryId === selectedId) return 1
        if (a.entryId === leaderId) return -1
        if (b.entryId === leaderId) return 1
        return (byId.get(a.entryId)?.finalPlace ?? 99) - (byId.get(b.entryId)?.finalPlace ?? 99)
    })
    for (const marker of labeled) {
        const pinned = marker.entryId === cheerId || marker.entryId === soloEntryId || marker.entryId === heldId
        const force = pinned || marker.entryId === selectedId
        if (!showTags && !pinned && !soloEntryId) continue
        const preferred = marker.sector % 2
        const slots = force ? [2, 1, 0] : [preferred, 1 - preferred, 2]
        let chosen: number | null = null
        for (const slot of slots) {
            const stand = markerBadge(marker, scale, camera.zoom, force, occupiedSector(marker))?.stand
            if (!stand) break
            const box = labelBox(marker, scale, camera.zoom, slot, stand)
            if (!box) break
            const hitsPeg = pegObstacles.some((item) => boxesOverlap(item, box, scale))
            const hitsLabel = placedLabels.some((item) => boxesOverlap(item, box, scale))
            if (hitsPeg || hitsLabel) continue
            chosen = slot
            placedLabels.push(box)
            break
        }
        if (chosen == null && force) {
            chosen = 2
            const stand = markerBadge(marker, scale, camera.zoom, true, occupiedSector(marker))?.stand
            const box = stand ? labelBox(marker, scale, camera.zoom, 2, stand) : null
            if (box) placedLabels.push(box)
        }
        if (chosen != null) labelSlots.set(marker.entryId, chosen)
    }

    const expanded = fullscreen !== 'off'

    return (
        <Box
            ref={frameRef}
            className="pc-lake-frame"
            style={
                expanded
                    ? {
                          height: '100%',
                          minHeight: fullscreen === 'page' ? '100dvh' : undefined,
                          display: 'flex',
                          flexDirection: 'column',
                          boxSizing: 'border-box',
                          background: 'var(--pc-bg)',
                          padding: 12,
                          ...(fullscreen === 'page' ? { position: 'fixed', inset: 0, zIndex: 300 } : undefined),
                      }
                    : undefined
            }
        >
            <Stack gap="sm" style={expanded ? { flex: 1, minHeight: 0 } : undefined}>
                <Group justify="space-between" align="flex-end" wrap="wrap">
                    <Text className="pc-display" style={{ fontSize: '1.15rem' }}>
                        {title}
                    </Text>
                    <Group gap={6}>
                        {soloEntryId ? null : (
                            <Button size="xs" variant={showTags ? 'filled' : 'default'} onClick={() => setShowTags((value) => !value)}>
                                {showTags ? 'Скрыть теги' : 'Теги'}
                            </Button>
                        )}
                        {followCatches && !soloEntryId ? (
                            <>
                                <Button size="xs" variant={drive === 'auto' ? 'filled' : 'default'} onClick={() => setDrive('auto')}>
                                    Авто
                                </Button>
                                <Button size="xs" variant={drive === 'hand' ? 'filled' : 'default'} onClick={takeHand}>
                                    Сам
                                </Button>
                            </>
                        ) : null}
                        <Button size="xs" variant={expanded ? 'filled' : 'default'} onClick={() => void toggleFullscreen()}>
                            {expanded ? 'Свернуть' : 'На весь экран'}
                        </Button>
                    </Group>
                </Group>

                {soloEntryId || leaders.length === 0 ? null : (
                    <Group gap="xs" wrap="wrap">
                        {leaders.map((row) => (
                            <Button
                                key={row.entryId}
                                size="xs"
                                variant={selectedId === row.entryId ? 'filled' : 'light'}
                                color={row.entryId === leaderId ? 'signal' : 'gray'}
                                onClick={() => focusEntry(row.entryId)}
                            >
                                {row.finalPlace == null ? '' : `${formatPlace(row.finalPlace)}. `}
                                {row.teamName} · {grams(row.totalWeight)}
                            </Button>
                        ))}
                    </Group>
                )}

                {soloEntryId || !cheerId || !byId.get(cheerId) ? null : (
                    <Group gap="xs">
                        <Button size="xs" variant="filled" color="signal" onClick={() => cheerFor(cheerId)}>
                            Болею за {byId.get(cheerId)?.teamName}
                        </Button>
                        <Button size="xs" variant="default" onClick={stopCheer}>
                            Хватит
                        </Button>
                    </Group>
                )}

                {soloEntryId ? null : (
                    <Group align="flex-start" wrap="wrap" gap="sm">
                        <Box style={{ position: 'relative', flex: '1 1 280px', minWidth: 240 }}>
                            <TextInput
                                placeholder="Найти команду"
                                value={query}
                                onChange={(event) => setQuery(event.currentTarget.value)}
                                onKeyDown={(event) => {
                                    const first = suggestions[0]
                                    if (event.key === 'Enter' && first) focusEntry(first.entryId)
                                }}
                            />
                            {suggestions.length > 0 ? (
                                <Panel p={4} style={{ position: 'absolute', zIndex: 2, left: 0, right: 0, top: '100%' }}>
                                    <Stack gap={2}>
                                        {suggestions.map((row) => (
                                            <Button key={row.entryId} variant="subtle" justify="space-between" onClick={() => focusEntry(row.entryId)}>
                                                <span>{row.teamName}</span>
                                                <Text span size="xs" c="dimmed">
                                                    {row.finalPlace == null ? '' : formatPlace(row.finalPlace)}
                                                </Text>
                                            </Button>
                                        ))}
                                    </Stack>
                                </Panel>
                            ) : null}
                        </Box>
                        <Group gap={6}>
                            {(
                                [
                                    ['all', 'Все'],
                                    ['A', 'Зона A'],
                                    ['B', 'Зона B'],
                                ] as const
                            ).map(([value, label]) => (
                                <Button key={value} size="xs" variant={zoneFilter === value ? 'filled' : 'default'} onClick={() => setZoneFilter(value)}>
                                    {label}
                                </Button>
                            ))}
                        </Group>
                    </Group>
                )}

                <Box
                    style={{
                        position: expanded || soloEntryId ? 'relative' : 'sticky',
                        top: expanded || soloEntryId ? undefined : 8,
                        zIndex: 2,
                        background: 'var(--pc-bg)',
                        ...(expanded ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined),
                    }}
                >
                    {spotlight ? (
                        <Group
                            data-catch-strip
                            justify="space-between"
                            align="center"
                            wrap="nowrap"
                            gap="sm"
                            px="sm"
                            py={6}
                            mb={6}
                            style={{
                                border: '1px solid var(--pc-line)',
                                borderRadius: 'var(--pc-radius)',
                                background: 'var(--pc-panel)',
                            }}
                        >
                            <div style={{ minWidth: 0 }}>
                                <Text size="xs" c="dimmed" tt="uppercase">
                                    Взвешивание
                                </Text>
                                <Text fw={700} lineClamp={1}>
                                    {spotlight.teamName}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    {spotlight.zone ? `зона ${spotlight.zone}` : 'зона'}
                                    {spotlight.sector != null ? ` · сектор ${spotlight.sector}` : ''}
                                </Text>
                            </div>
                            <Text className="pc-display pc-tabular" c="var(--pc-signal)" style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                                {grams(spotlight.grams)}
                            </Text>
                        </Group>
                    ) : null}
                    <Box
                        ref={stageRef}
                        style={{
                            width: soloEntryId
                                ? `min(100%, calc(min(52dvh, 520px) * ${LAKE_FRAME.width / LAKE_FRAME.height}))`
                                : `min(100%, calc(min(82dvh, 900px) * ${LAKE_FRAME.width / LAKE_FRAME.height}))`,
                            maxWidth: 980,
                            marginInline: 'auto',
                            position: 'relative',
                            overflow: 'hidden',
                            background: 'var(--pc-panel)',
                            border: '1px solid var(--pc-line)',
                            borderRadius: 'var(--pc-radius)',
                            cursor: 'grab',
                            touchAction: 'none',
                            ...(expanded
                                ? { width: '100%', height: '100%', maxHeight: 'none', flex: 1, minHeight: 0 }
                                : {
                                      aspectRatio: `${LAKE_FRAME.width} / ${LAKE_FRAME.height}`,
                                      height: 'auto',
                                      maxHeight: soloEntryId ? 'min(52dvh, 520px)' : 'min(82dvh, 900px)',
                                  }),
                        }}
                        onClick={(event) => {
                            if (movedRef.current) return
                            if ((event.target as Element).closest('[data-entry], [data-card], [data-camera-ui]')) return
                            if (!soloEntryId) setTracking(false)
                            setSelectedId(null)
                        }}
                        onPointerDown={(event) => {
                            if ((event.target as Element).closest('[data-entry], [data-card], [data-camera-ui]')) return
                            movedRef.current = false
                            pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
                            if (pointersRef.current.size === 1) {
                                const cam = cameraRef.current
                                dragRef.current = { x: event.clientX, y: event.clientY, cx: cam.cx, cy: cam.cy }
                                stageRef.current?.setPointerCapture(event.pointerId)
                            }
                            if (pointersRef.current.size === 2) {
                                const [a, b] = [...pointersRef.current.values()]
                                const midX = (a.x + b.x) / 2
                                const midY = (a.y + b.y) / 2
                                const world = worldAt(midX, midY)
                                pinchRef.current = {
                                    distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
                                    zoom: cameraRef.current.zoom,
                                    worldX: world?.x ?? cameraRef.current.cx,
                                    worldY: world?.y ?? cameraRef.current.cy,
                                }
                                dragRef.current = null
                            }
                        }}
                        onPointerMove={(event) => {
                            if (!pointersRef.current.has(event.pointerId)) return
                            pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
                            if (pointersRef.current.size >= 2 && pinchRef.current) {
                                const [a, b] = [...pointersRef.current.values()]
                                const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1
                                const midX = (a.x + b.x) / 2
                                const midY = (a.y + b.y) / 2
                                movedRef.current = true
                                takeHand()
                                lookAt(pinchRef.current.worldX, pinchRef.current.worldY, pinchRef.current.zoom * (distance / pinchRef.current.distance), midX, midY)
                                return
                            }
                            const drag = dragRef.current
                            if (!drag) return
                            const dx = event.clientX - drag.x
                            const dy = event.clientY - drag.y
                            if (Math.hypot(dx, dy) > 4) movedRef.current = true
                            if (!soloEntryId && movedRef.current) {
                                setTracking(false)
                                if (followCatches && drive === 'auto') takeHand()
                            }
                            const current = pxPerWorld(cameraRef.current.zoom)
                            commit({ cx: drag.cx - dx / current, cy: drag.cy - dy / current, zoom: cameraRef.current.zoom })
                        }}
                        onPointerUp={(event) => {
                            pointersRef.current.delete(event.pointerId)
                            dragRef.current = null
                            if (pointersRef.current.size < 2) pinchRef.current = null
                        }}
                        onPointerCancel={(event) => {
                            pointersRef.current.delete(event.pointerId)
                            dragRef.current = null
                            pinchRef.current = null
                        }}
                    >
                        <svg
                            viewBox={viewBox}
                            preserveAspectRatio="xMidYMid meet"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
                            role="img"
                            aria-label="Схема водоёма"
                        >
                            <path
                                d={WATER_PATH}
                                fill="color-mix(in srgb, #2f6f9f 42%, var(--pc-panel))"
                                stroke="color-mix(in srgb, var(--pc-text) 28%, #2f6f9f)"
                                strokeWidth={screenPx(2.5, camera.zoom, 1.5, 3) / scale}
                            />
                            <path
                                d={ISLAND_PATH}
                                fill="color-mix(in srgb, #6b8f71 45%, var(--pc-panel))"
                                stroke="var(--pc-line)"
                                strokeWidth={screenPx(1.2, camera.zoom, 1, 2) / scale}
                            />
                            <text
                                x={LAKE_LABELS.zoneA.x}
                                y={LAKE_LABELS.zoneA.y}
                                fill="var(--pc-zone-a)"
                                fontSize={screenPx(16, camera.zoom, 12, 20) / scale}
                                fontWeight={700}
                                style={{ fontFamily: 'var(--pc-font-display)' }}
                            >
                                ЗОНА A
                            </text>
                            <text
                                x={LAKE_LABELS.zoneB.x}
                                y={LAKE_LABELS.zoneB.y}
                                fill="var(--pc-zone-b)"
                                fontSize={screenPx(16, camera.zoom, 12, 20) / scale}
                                fontWeight={700}
                                style={{ fontFamily: 'var(--pc-font-display)' }}
                            >
                                ЗОНА B
                            </text>
                            <text
                                x={LAKE_LABELS.river.x}
                                y={LAKE_LABELS.river.y}
                                fill="var(--pc-muted)"
                                fontSize={screenPx(12, camera.zoom, 10, 14) / scale}
                                style={{ fontFamily: 'var(--pc-font-body)' }}
                            >
                                Березовка
                            </text>
                            <text
                                x={LAKE_LABELS.road.x}
                                y={LAKE_LABELS.road.y}
                                fill="var(--pc-muted)"
                                fontSize={screenPx(11, camera.zoom, 9, 13) / scale}
                                transform={`rotate(${LAKE_LABELS.road.rotate} ${LAKE_LABELS.road.x} ${LAKE_LABELS.road.y})`}
                                style={{ fontFamily: 'var(--pc-font-body)' }}
                            >
                                дорога
                            </text>
                            <SectorPegs zone="A" occupied={occupied.A} scale={scale} zoom={camera.zoom} />
                            <SectorPegs zone="B" occupied={occupied.B} scale={scale} zoom={camera.zoom} />
                            {visibleMarkers.map((marker) => (
                                <TeamMark
                                    key={marker.entryId}
                                    marker={marker}
                                    spectator={byId.get(marker.entryId)}
                                    selected={marker.entryId === selectedId || marker.entryId === heldId}
                                    leader={marker.entryId === leaderId}
                                    cheered={marker.entryId === cheerId}
                                    spot={spotlight?.entryId === marker.entryId ? spotlight : null}
                                    labelSlot={labelSlots.get(marker.entryId) ?? null}
                                    crowded={occupiedSector(marker)}
                                    scale={scale}
                                    zoom={camera.zoom}
                                    onSelect={focusEntry}
                                />
                            ))}
                        </svg>
                    </Box>
                    <Group data-camera-ui gap={6} justify="center">
                        <Button size="sm" variant="default" aria-label="Отдалить" onClick={() => zoomBy(1 / ZOOM_STEP)}>
                            −
                        </Button>
                        <Text size="xs" className="pc-tabular" w={52} ta="center">
                            {Math.round(camera.zoom * 100)}%
                        </Text>
                        <Button size="sm" variant="default" aria-label="Приблизить" onClick={() => zoomBy(ZOOM_STEP)}>
                            +
                        </Button>
                        <Button size="sm" variant="light" onClick={fitLake}>
                            Всё озеро
                        </Button>
                    </Group>
                    {selected && !soloEntryId ? (
                        <Box
                            data-card
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 3,
                                display: 'grid',
                                placeItems: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            <Box style={{ pointerEvents: 'auto', width: 'min(340px, calc(100% - 24px))', maxHeight: 'min(78%, 420px)', overflow: 'auto' }}>
                                <ResultCard
                                    spectator={selected}
                                    marker={selectedMarker}
                                    miniTitle={miniTitle}
                                    cheering={selected.entryId === cheerId}
                                    tournamentId={tournamentId}
                                    onCheer={() => (selected.entryId === cheerId ? stopCheer() : cheerFor(selected.entryId))}
                                    onClose={() => {
                                        setTracking(false)
                                        setSelectedId(null)
                                    }}
                                />
                            </Box>
                        </Box>
                    ) : null}
                </Box>
                <Text size="xs" c="dimmed">
                    {soloEntryId
                        ? (note ?? 'На схеме только эта команда. Сдвиг и щипок двигают камеру.')
                        : followCatches
                          ? `${note ? `${note}. ` : ''}${
                                drive === 'auto'
                                    ? 'Авто: камера подъезжает к свежему улову и остаётся на этой команде. Следующий улов переводит её дальше.'
                                    : 'Сам: палец двигает камеру, щипок приближает. Новый улов остаётся подписью на берегу.'
                            }`
                          : `${note ? `${note}. ` : ''}Озеро стоит на месте: палец двигает камеру, щипок приближает. Нажмите на команду, чтобы открыть результат.`}
                </Text>
            </Stack>
        </Box>
    )
}

function miniGrams(entryId: string, window: MapWindow, catches: CatchRow[], miniTours: MiniTour[]): number | null {
    if (window.state === 'off') return null
    const mini = miniTours.find((item) => item.tour_number === window.tour && item.mini_number === window.mini)
    if (!mini) return null
    const rows = catches.filter((row) => row.entry_id === entryId && row.mini_tour_id === mini.id)
    if (rows.length === 0) return null
    return rows.reduce((sum, row) => sum + row.weight_grams, 0)
}

function toSpectator(row: StandingRow, window: MapWindow, catches: CatchRow[], miniTours: MiniTour[], slipCode: string | null): MapSpectator {
    return {
        entryId: row.entryId,
        teamId: row.teamId,
        teamName: row.teamName,
        rosterNames: row.rosterNames,
        slipCode,
        finalPlace: row.finalPlace,
        placeSum: row.placeSum,
        zoneAWeight: row.zoneAWeight,
        zoneBWeight: row.zoneBWeight,
        totalWeight: row.totalWeight,
        miniGrams: miniGrams(row.entryId, window, catches, miniTours),
    }
}

export function LakeBoard({
    tournament,
    segments,
    entries,
    catches,
    miniTours,
    onlyEntryId,
    followCatches = false,
}: {
    tournament: Tournament
    segments: ScheduleSegment[]
    entries: TournamentEntry[]
    catches: CatchRow[]
    miniTours: MiniTour[]
    onlyEntryId?: string
    followCatches?: boolean
}) {
    const now = useNow(1_000)
    const mapWindow = resolveMapWindow(tournament, segments, now)
    const markers = teamMarkers(onlyEntryId ? entries.filter((entry) => entry.id === onlyEntryId) : entries, mapWindow)
    const hasSlips = entries.some((entry) => entry.draw_slip)
    const standings = useMemo(
        () => computeStandings(entries, catches, miniTours, { zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one }),
        [entries, catches, miniTours, tournament.zero_place_is_group_size_plus_one]
    )
    const slipByEntry = useMemo(() => new Map(entries.map((entry) => [entry.id, entry.draw_slip?.code ?? null])), [entries])
    const spectators = standings.map((row) => toSpectator(row, mapWindow, catches, miniTours, slipByEntry.get(row.entryId) ?? null))
    const leaders = spectators.slice(0, 3)
    const catchKey = useMemo(
        () =>
            catches
                .map((row) => row.id)
                .sort()
                .join('|'),
        [catches]
    )
    const [seenCatchKey, setSeenCatchKey] = useState<string | null>(null)
    const [arrival, setArrival] = useState<CatchSpot | null>(null)
    if (seenCatchKey !== catchKey) {
        const previous = seenCatchKey
        setSeenCatchKey(catchKey)
        if (previous) {
            const known = new Set(previous.split('|'))
            const fresh = buildCatchLog(entries, catches, miniTours).find((item) => !known.has(item.id))
            if (fresh) {
                setArrival({
                    id: fresh.id,
                    entryId: fresh.entryId,
                    grams: fresh.grams,
                    teamName: fresh.teamName,
                    zone: fresh.zone,
                    sector: fresh.sector,
                })
            }
        }
    }

    if (tournament.status === 'finished' && !hasSlips) {
        return <EmptyState title="Карта пуста" description="У архивного турнира нет бумажек — секторы команд неизвестны." />
    }

    const note = onlyEntryId
        ? markers.length > 0
            ? undefined
            : 'Сейчас не на берегу'
        : markers.length > 0
          ? undefined
          : mapWindow.state === 'off'
            ? 'На схеме никого нет'
            : 'На карте только команды с бумажкой'
    const miniTitle = mapWindow.state === 'off' ? null : mapWindow.state === 'moving' ? `Переход · мини-тур ${mapWindow.mini}` : `Мини-тур ${mapWindow.mini}`

    return (
        <LakeMap
            title={mapWindow.label}
            markers={markers}
            spectators={onlyEntryId ? spectators.filter((row) => row.entryId === onlyEntryId) : spectators}
            leaders={onlyEntryId ? [] : leaders}
            arrival={arrival}
            followCatches={followCatches}
            miniTitle={miniTitle}
            note={note}
            tournamentId={tournament.id}
            soloEntryId={onlyEntryId}
        />
    )
}
