import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet'
import { Text } from '@mantine/core'
import {
  DEFAULT_VENUE_CENTER,
  DEFAULT_VENUE_ZOOM,
  zoneColor,
  type VenueMap,
} from '../features/tournament/venueMap'
import { ensureLeafletIcons, OSM_ATTRIBUTION, OSM_TILE_URL } from './venueLeaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  venueMap: VenueMap | null
  height?: number | string
  interactive?: boolean
}

export function VenueMapView({ venueMap, height = 360, interactive = true }: Props) {
  useEffect(() => {
    ensureLeafletIcons()
  }, [])

  const data = venueMap
  const center = data?.center ?? DEFAULT_VENUE_CENTER
  const zoom = data?.zoom ?? DEFAULT_VENUE_ZOOM

  const polygons = useMemo(() => data?.zones ?? [], [data])

  if (!data || (polygons.length === 0 && !data.meetingPoint)) {
    return (
      <Text size="sm" c="dimmed">
        Карта площадки ещё не задана. Штаб отмечает точку сбора и зоны на вкладке «Площадка».
      </Text>
    )
  }

  return (
    <div style={{ height, width: '100%', borderRadius: 'var(--pc-radius)', overflow: 'hidden' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        zoomControl={interactive}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
        {polygons.map((zone) => (
          <Polygon
            key={zone.code}
            positions={zone.ring.map(([lat, lng]) => [lat, lng] as [number, number])}
            pathOptions={{
              color: zoneColor(zone.code),
              fillColor: zoneColor(zone.code),
              fillOpacity: 0.28,
              weight: 2,
            }}
          >
            <Popup>Зона {zone.code}</Popup>
          </Polygon>
        ))}
        {data.meetingPoint && (
          <Marker position={[data.meetingPoint.lat, data.meetingPoint.lng]}>
            <Popup>{data.meetingPoint.label?.trim() || 'Точка сбора'}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
