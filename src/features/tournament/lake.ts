import type { ZoneCode } from './types'

export type LakePoint = { x: number; y: number }

export const LAKE_VIEW = { width: 800, height: 640 }
/** Плотная рамка берега: «всё озеро» без пустых полей холста. */
export const LAKE_FRAME = { x: 125, y: 18, width: 550, height: 590 }
export const SECTORS_PER_ZONE = 35

/** Берег по часовой стрелке от юго-западного угла, по контуру озера у Паўстыни. */
const SHORE: LakePoint[] = [
    { x: 230, y: 451 },
    { x: 206, y: 386 },
    { x: 185, y: 317 },
    { x: 187, y: 249 },
    { x: 201, y: 163 },
    { x: 221, y: 88 },
    { x: 244, y: 79 },
    { x: 277, y: 80 },
    { x: 322, y: 88 },
    { x: 327, y: 92 },
    { x: 393, y: 147 },
    { x: 405, y: 171 },
    { x: 407, y: 203 },
    { x: 433, y: 230 },
    { x: 443, y: 254 },
    { x: 481, y: 284 },
    { x: 544, y: 347 },
    { x: 567, y: 376 },
    { x: 612, y: 499 },
    { x: 615, y: 511 },
    { x: 613, y: 525 },
    { x: 602, y: 530 },
    { x: 583, y: 528 },
    { x: 542, y: 518 },
    { x: 417, y: 494 },
    { x: 266, y: 461 },
    { x: 234, y: 454 },
]

/** Поворот к дороге, у излома перед длинным восточным берегом. */
const ZONE_SPLIT = 15

const ISLAND: LakePoint[] = [
    { x: 409, y: 311 },
    { x: 423, y: 313 },
    { x: 434, y: 328 },
    { x: 435, y: 334 },
    { x: 428, y: 339 },
    { x: 406, y: 337 },
    { x: 402, y: 330 },
    { x: 404, y: 315 },
]

const STAGING: Record<ZoneCode, LakePoint> = {
    A: { x: 150, y: 510 },
    B: { x: 390, y: 48 },
}

export const LAKE_LABELS = {
    zoneA: { x: 270, y: 250 },
    zoneB: { x: 470, y: 410 },
    river: { x: 390, y: 585 },
    road: { x: 600, y: 190, rotate: 58 },
}

function distance(a: LakePoint, b: LakePoint): number {
    return Math.hypot(b.x - a.x, b.y - a.y)
}

function lerp(a: LakePoint, b: LakePoint, t: number): LakePoint {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function pointAlong(points: LakePoint[], distanceAlong: number): LakePoint {
    let left = distanceAlong
    for (let i = 1; i < points.length; i++) {
        const span = distance(points[i - 1], points[i])
        if (left <= span || i === points.length - 1) {
            const t = span === 0 ? 0 : Math.min(1, left / span)
            return lerp(points[i - 1], points[i], t)
        }
        left -= span
    }
    return points[points.length - 1]
}

function pathLength(points: LakePoint[]): number {
    let total = 0
    for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i])
    return total
}

/** 35 точек по середине равных участков берега. */
function sampleSectors(points: LakePoint[]): LakePoint[] {
    const total = pathLength(points)
    return Array.from({ length: SECTORS_PER_ZONE }, (_, index) => pointAlong(points, (total * (index + 0.5)) / SECTORS_PER_ZONE))
}

const zoneAPath = SHORE.slice(0, ZONE_SPLIT + 1)
const zoneBPath = [...SHORE.slice(ZONE_SPLIT), SHORE[0]]
const SHORE_A_LENGTH = pathLength(zoneAPath)
const SHORE_B_LENGTH = pathLength(zoneBPath)
const SHORE_LOOP = SHORE_A_LENGTH + SHORE_B_LENGTH

const ZONE_POINTS: Record<ZoneCode, LakePoint[]> = {
    A: sampleSectors(zoneAPath),
    B: sampleSectors(zoneBPath),
}

export const LAKE_CENTER: LakePoint = SHORE.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 })

LAKE_CENTER.x /= SHORE.length
LAKE_CENTER.y /= SHORE.length

export function polylinePath(points: LakePoint[], close = false): string {
    const [first, ...rest] = points
    const body = rest.reduce((path, point) => `${path} L ${point.x} ${point.y}`, `M ${first.x} ${first.y}`)
    return close ? `${body} Z` : body
}

export const WATER_PATH = polylinePath(SHORE, true)
export const ISLAND_PATH = polylinePath(ISLAND, true)

export function sectorPoint(zone: ZoneCode, sector: number): LakePoint | null {
    if (sector < 1 || sector > SECTORS_PER_ZONE) return null
    return ZONE_POINTS[zone][sector - 1] ?? null
}

/** Середина плотного берега зоны A. Стартовый кадр, когда озеро крупнее экрана. */
export const LAKE_READING: LakePoint = sectorPoint('A', 18) ?? { x: 190, y: 280 }

export function sectorPoints(zone: ZoneCode): LakePoint[] {
    return ZONE_POINTS[zone]
}

export function outward(point: LakePoint, distanceOut: number): LakePoint {
    const dx = point.x - LAKE_CENTER.x
    const dy = point.y - LAKE_CENTER.y
    const length = Math.hypot(dx, dy) || 1
    return { x: point.x + (dx / length) * distanceOut, y: point.y + (dy / length) * distanceOut }
}

function shoreDistance(zone: ZoneCode, sector: number): number {
    const zoneLength = zone === 'A' ? SHORE_A_LENGTH : SHORE_B_LENGTH
    const along = (zoneLength * (sector - 0.5)) / SECTORS_PER_ZONE
    return zone === 'A' ? along : SHORE_A_LENGTH + along
}

function pointOnShore(distance: number): LakePoint {
    const loop = SHORE_LOOP || 1
    const wrapped = ((distance % loop) + loop) % loop
    if (wrapped <= SHORE_A_LENGTH) return pointAlong(zoneAPath, wrapped)
    return pointAlong(zoneBPath, wrapped - SHORE_A_LENGTH)
}

/** Кратчайшая дуга берега между двумя секторами. При равенстве — по часовой. */
function pointAlongShore(fromZone: ZoneCode, fromSector: number, toZone: ZoneCode, toSector: number, progress: number): LakePoint {
    const from = shoreDistance(fromZone, fromSector)
    const to = shoreDistance(toZone, toSector)
    const clockwise = (to - from + SHORE_LOOP) % SHORE_LOOP
    const counter = (from - to + SHORE_LOOP) % SHORE_LOOP
    if (clockwise === 0) return pointOnShore(from)
    const forward = clockwise <= counter
    const traveled = (forward ? clockwise : counter) * progress
    return pointOnShore(forward ? from + traveled : from - traveled)
}

export function markerPosition(input: {
    zone: ZoneCode
    sector: number
    fromZone: ZoneCode | null
    fromSector: number | null
    progress: number
    state: 'fishing' | 'moving'
}): LakePoint | null {
    const destination = sectorPoint(input.zone, input.sector)
    if (!destination) return null
    if (input.state === 'fishing') return destination
    const progress = Math.min(1, Math.max(0, input.progress))
    if (input.fromZone && input.fromSector != null) {
        return pointAlongShore(input.fromZone, input.fromSector, input.zone, input.sector, progress)
    }
    const origin = STAGING[input.zone]
    return lerp(origin, destination, progress)
}
