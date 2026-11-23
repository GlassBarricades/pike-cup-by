import { useEffect, useMemo, useState } from 'react'
import { Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import { updateVenueMap } from '../../features/tournament/api'
import { getFormat, zoneCodes } from '../../features/tournament/formats'
import {
  invalidateTournamentCard,
  invalidateTournamentLists,
} from '../../features/tournament/hooks'
import {
  EMPTY_VENUE_MAP,
  parseVenueMap,
  zoneColor,
  type VenueMap,
} from '../../features/tournament/venueMap'
import type { Tournament } from '../../features/tournament/types'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import { ensureLeafletIcons, OSM_ATTRIBUTION, OSM_TILE_URL } from '../../ui/venueLeaflet'
import { Panel, SectionTitle } from '../../ui'
import 'leaflet/dist/leaflet.css'

type DrawMode = 'idle' | 'meeting' | { kind: 'zone'; code: string }

type Props = {
  tournament: Tournament
}

function MapClickHandler({
  mode,
  onMeeting,
  onVertex,
}: {
  mode: DrawMode
  onMeeting: (lat: number, lng: number) => void
  onVertex: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (mode === 'idle') return
      if (mode === 'meeting') {
        onMeeting(e.latlng.lat, e.latlng.lng)
        return
      }
      onVertex(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function ViewTracker({
  onView,
}: {
  onView: (center: { lat: number; lng: number }, zoom: number) => void
}) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter()
      onView({ lat: c.lat, lng: c.lng }, e.target.getZoom())
    },
    zoomend(e) {
      const c = e.target.getCenter()
      onView({ lat: c.lat, lng: c.lng }, e.target.getZoom())
    },
  })
  return null
}

export function VenueMapEditor({ tournament }: Props) {
  const closed = useTournamentDayClosed()
  const format = getFormat(tournament)
  const queryClient = useQueryClient()
  const initial = useMemo(
    () => parseVenueMap(tournament.venue_map) ?? { ...EMPTY_VENUE_MAP },
    [tournament.venue_map],
  )
  const [draft, setDraft] = useState<VenueMap>(initial)
  const [mode, setMode] = useState<DrawMode>('idle')
  const [draftRing, setDraftRing] = useState<[number, number][]>([])
  const [meetingLabel, setMeetingLabel] = useState(initial.meetingPoint?.label ?? 'Точка сбора')

  useEffect(() => {
    ensureLeafletIcons()
  }, [])

  useEffect(() => {
    setDraft(initial)
    setMeetingLabel(initial.meetingPoint?.label ?? 'Точка сбора')
    setMode('idle')
    setDraftRing([])
  }, [initial])

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: VenueMap = {
        ...draft,
        meetingPoint: draft.meetingPoint
          ? {
              ...draft.meetingPoint,
              label: meetingLabel.trim() || 'Точка сбора',
            }
          : null,
      }
      return updateVenueMap(tournament.id, payload)
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateTournamentCard(queryClient, tournament.id),
        invalidateTournamentLists(queryClient),
      ])
      setMode('idle')
      setDraftRing([])
    },
  })

  const clearMutation = useMutation({
    mutationFn: () => updateVenueMap(tournament.id, null),
    onSuccess: async () => {
      await Promise.all([
        invalidateTournamentCard(queryClient, tournament.id),
        invalidateTournamentLists(queryClient),
      ])
      setDraft({ ...EMPTY_VENUE_MAP })
      setMode('idle')
      setDraftRing([])
    },
  })

  const finishZone = () => {
    if (typeof mode === 'object' && mode.kind === 'zone' && draftRing.length >= 3) {
      const code = mode.code
      setDraft((prev) => ({
        ...prev,
        zones: [...prev.zones.filter((z) => z.code !== code), { code, ring: draftRing }],
      }))
      setDraftRing([])
      setMode('idle')
    }
  }

  const cancelDraw = () => {
    setDraftRing([])
    setMode('idle')
  }

  if (tournament.map_mode !== 'geo') {
    return (
      <Panel>
        <Stack gap="sm">
          <SectionTitle>Карта площадки</SectionTitle>
          <Text size="sm" c="dimmed">
            Сейчас в карточке турнира выбрана «Схема озера (как на PikeCup)». Переключите на
            «Настоящая карта (OSM)», чтобы редактировать точку сбора и зоны здесь.
          </Text>
        </Stack>
      </Panel>
    )
  }

  return (
    <Stack gap="md">
      <Panel>
        <Stack gap="md">
          <SectionTitle>Карта площадки</SectionTitle>
          <Text size="sm" c="dimmed">
            Отметьте точку сбора и нарисуйте полигоны зон на карте OpenStreetMap. Сохраняется для
            этого турнира.
          </Text>
          <Group gap="xs" wrap="wrap">
            <Button
              size="xs"
              variant={mode === 'meeting' ? 'filled' : 'light'}
              disabled={closed}
              onClick={() => {
                setDraftRing([])
                setMode(mode === 'meeting' ? 'idle' : 'meeting')
              }}
            >
              Точка сбора
            </Button>
            {zoneCodes(format).map((code) => (
              <Button
                key={code}
                size="xs"
                color={code === 'A' ? 'blue' : code === 'B' ? 'orange' : 'gray'}
                variant={typeof mode === 'object' && mode.code === code ? 'filled' : 'light'}
                disabled={closed}
                onClick={() => {
                  setDraftRing([])
                  setMode(
                    typeof mode === 'object' && mode.code === code
                      ? 'idle'
                      : { kind: 'zone', code },
                  )
                }}
              >
                Зона {code}
              </Button>
            ))}
            {typeof mode === 'object' && (
              <>
                <Button
                  size="xs"
                  color="teal"
                  disabled={draftRing.length < 3 || closed}
                  onClick={finishZone}
                >
                  Замкнуть ({draftRing.length})
                </Button>
                <Button size="xs" variant="subtle" onClick={cancelDraw}>
                  Отмена
                </Button>
              </>
            )}
            {draft.meetingPoint && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                disabled={closed}
                onClick={() => setDraft((prev) => ({ ...prev, meetingPoint: null }))}
              >
                Убрать сбор
              </Button>
            )}
            {draft.zones.map((z) => (
              <Button
                key={`del-${z.code}`}
                size="xs"
                variant="subtle"
                color="red"
                disabled={closed}
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    zones: prev.zones.filter((row) => row.code !== z.code),
                  }))
                }
              >
                Убрать {z.code}
              </Button>
            ))}
          </Group>
          {mode === 'meeting' && (
            <Text size="xs" c="dimmed">
              Кликните на карте, куда ставить точку сбора.
            </Text>
          )}
          {typeof mode === 'object' && (
            <Text size="xs" c="dimmed">
              Кликайте вершины полигона зоны {mode.code}, затем «Замкнуть» (нужно ≥3 точки).
            </Text>
          )}
          <TextInput
            label="Подпись точки сбора"
            value={meetingLabel}
            onChange={(e) => setMeetingLabel(e.currentTarget.value)}
            disabled={closed || !draft.meetingPoint}
          />
          <div
            style={{
              height: 420,
              width: '100%',
              borderRadius: 'var(--pc-radius)',
              overflow: 'hidden',
              border: '1px solid var(--pc-line)',
            }}
          >
            <MapContainer
              key={tournament.id}
              center={[draft.center.lat, draft.center.lng]}
              zoom={draft.zoom}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
              <ViewTracker
                onView={(center, zoom) =>
                  setDraft((prev) => ({ ...prev, center, zoom }))
                }
              />
              <MapClickHandler
                mode={mode}
                onMeeting={(lat, lng) => {
                  setDraft((prev) => ({
                    ...prev,
                    meetingPoint: { lat, lng, label: meetingLabel.trim() || 'Точка сбора' },
                  }))
                  setMode('idle')
                }}
                onVertex={(lat, lng) => setDraftRing((prev) => [...prev, [lat, lng]])}
              />
              {draft.zones.map((zone) => (
                <Polygon
                  key={zone.code}
                  positions={zone.ring.map(([lat, lng]) => [lat, lng] as [number, number])}
                  pathOptions={{
                    color: zoneColor(zone.code),
                    fillColor: zoneColor(zone.code),
                    fillOpacity: 0.28,
                    weight: 2,
                  }}
                />
              ))}
              {draftRing.length > 0 && (
                <Polyline
                  positions={draftRing}
                  pathOptions={{
                    color:
                      typeof mode === 'object' ? zoneColor(mode.code) : '#666',
                    dashArray: '6 6',
                    weight: 2,
                  }}
                />
              )}
              {draft.meetingPoint && (
                <Marker
                  position={[draft.meetingPoint.lat, draft.meetingPoint.lng]}
                />
              )}
            </MapContainer>
          </div>
          <Group>
            <Button
              color="signal"
              loading={saveMutation.isPending}
              disabled={closed}
              onClick={() => saveMutation.mutate()}
            >
              Сохранить карту
            </Button>
            <Button
              variant="light"
              color="red"
              loading={clearMutation.isPending}
              disabled={closed || (!tournament.venue_map && !draft.meetingPoint && draft.zones.length === 0)}
              onClick={() => {
                if (!window.confirm('Очистить карту площадки у этого турнира?')) return
                clearMutation.mutate()
              }}
            >
              Очистить
            </Button>
          </Group>
          {saveMutation.isSuccess && (
            <Text size="sm" c="dimmed">
              Сохранено
            </Text>
          )}
          {(saveMutation.isError || clearMutation.isError) && (
            <Text size="sm" c="red">
              {((saveMutation.error ?? clearMutation.error) as Error).message}
            </Text>
          )}
        </Stack>
      </Panel>
    </Stack>
  )
}
