import { z } from 'zod'
import type { TournamentFormat } from './formats/types'

/** schematic = SVG-озеро PikeCup; geo = Leaflet OSM */
export type TournamentMapMode = 'schematic' | 'geo'

const latLngSchema = z.object({
  lat: z.number().finite(),
  lng: z.number().finite(),
})

const ringSchema = z
  .array(z.tuple([z.number().finite(), z.number().finite()]))
  .min(3)

export const venueMapSchema = z.object({
  center: latLngSchema,
  zoom: z.number().finite().min(1).max(22),
  meetingPoint: latLngSchema
    .extend({ label: z.string().trim().min(1).max(80).optional() })
    .nullable(),
  zones: z.array(
    z.object({
      code: z.string().min(1).max(8),
      ring: ringSchema,
    }),
  ),
})

export type VenueMap = z.infer<typeof venueMapSchema>
export type VenueLatLng = z.infer<typeof latLngSchema>
export type VenueZonePolygon = VenueMap['zones'][number]

/** Центр Беларуси — стартовый вид, если карта ещё не сохранена. */
export const DEFAULT_VENUE_CENTER: VenueLatLng = { lat: 53.9, lng: 27.5667 }
export const DEFAULT_VENUE_ZOOM = 7

export const EMPTY_VENUE_MAP: VenueMap = {
  center: DEFAULT_VENUE_CENTER,
  zoom: DEFAULT_VENUE_ZOOM,
  meetingPoint: null,
  zones: [],
}

export function parseVenueMap(raw: unknown): VenueMap | null {
  if (raw == null) return null
  const parsed = venueMapSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export function zoneColor(code: string): string {
  const key = code.trim().toUpperCase()
  if (key === 'A') return '#1d4ed8'
  if (key === 'B') return '#b45309'
  if (key === 'C') return '#047857'
  return '#6b7280'
}

export function parseMapMode(raw: unknown): TournamentMapMode {
  return raw === 'geo' ? 'geo' : 'schematic'
}

/** Стартовый режим при создании: PikeCup → схема, иначе OSM. */
export function defaultMapModeForFormat(format: TournamentFormat): TournamentMapMode {
  return format.engine === 'pikecup' ? 'schematic' : 'geo'
}
