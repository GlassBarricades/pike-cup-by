import { Anchor, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatCatchClock } from '../../features/tournament/catchLog'
import { slotTitle } from '../../features/tournament/schedule'
import { formatPlaceShift, gramsLabel } from '../../features/tournament/spectator'
import { EmptyState } from '../../ui'
import { useV2Tournament } from './context'

export function V2Feed() {
  const { tournament, story } = useV2Tournament()
  if (story.moments.length === 0) {
    return <EmptyState title="Лента пустая" description="Строка появится с первым взвешиванием." />
  }
  return (
    <Stack gap={0}>
      {story.moments.map((moment) => {
        const shift = formatPlaceShift(moment.zonePlaceBefore, moment.zonePlaceAfter)
        const sumShift = moment.sumBefore != null && moment.sumAfter != null ? formatPlaceShift(moment.sumBefore, moment.sumAfter) : null
        const sectorQuery = moment.zone && moment.sector != null ? `?zone=${moment.zone}&sector=${moment.sector}` : ''
        return (
          <Group
            key={moment.id}
            justify="space-between"
            align="flex-start"
            wrap="nowrap"
            py="xs"
            style={{ borderBottom: '1px solid var(--pc-line)' }}
          >
            <div>
              <Text size="sm">
                <Text span className="pc-tabular">
                  {formatCatchClock(moment.createdAt)}
                </Text>
                {moment.zone ? ` · зона ${moment.zone}` : ''}
                {moment.sector != null ? ` · сектор ${moment.sector}` : ''}
                {moment.tour && moment.mini ? ` · ${slotTitle({ tour: moment.tour, mini: moment.mini })}` : ''}
              </Text>
              <Anchor component={Link} to={`/live/t/${tournament.id}/team/${moment.entryId}`} fw={700} c="inherit" underline="never">
                {moment.teamName}
              </Anchor>
              <Text size="sm" c="dimmed">
                {shift}
                {sumShift ? ` · сумма ${sumShift}` : ''}
              </Text>
              {sectorQuery ? (
                <Anchor component={Link} to={`/live/t/${tournament.id}/map${sectorQuery}`} size="xs" c="dimmed">
                  На карте
                </Anchor>
              ) : null}
            </div>
            <Text fw={700} className="pc-tabular" style={{ flexShrink: 0 }}>
              {gramsLabel(moment.grams)}
            </Text>
          </Group>
        )
      })}
    </Stack>
  )
}
