import { Stack, Text } from '@mantine/core'
import { useSeasonDigest } from '../../features/tournament/season'
import { fameFromBundles, gramsLabel } from '../../features/tournament/spectator'
import { slotTitle } from '../../features/tournament/schedule'
import { EmptyState, Panel } from '../../ui'
import { useMemo } from 'react'

export function V2Fame() {
  const { data: bundles = [], isLoading } = useSeasonDigest()
  const fame = useMemo(() => fameFromBundles(bundles), [bundles])
  if (isLoading) return <Text c="dimmed">Собираем зал славы…</Text>
  if (bundles.length === 0) return <EmptyState title="Пока не из чего собрать зал" />
  return (
    <Stack gap="sm">
      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Победы
        </Text>
        {fame.wins.length === 0 ? (
          <Text size="sm" c="dimmed">
            Победителей ещё нет
          </Text>
        ) : (
          fame.wins.map((row) => (
            <Text key={row.label} size="sm">
              {row.label} · {row.count}
            </Text>
          ))
        )}
      </Panel>
      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Самый тяжёлый мини-тур
        </Text>
        <Text size="sm">
          {fame.heaviest
            ? `${fame.heaviest.teamName} · ${gramsLabel(fame.heaviest.grams)} · ${fame.heaviest.tournamentName} · ${slotTitle(fame.heaviest)}`
            : '—'}
        </Text>
      </Panel>
      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Серия подиумов
        </Text>
        <Text size="sm">{fame.streak ? `${fame.streak.label} · ${fame.streak.length} старта подряд` : 'Серии длиннее одного старта нет'}</Text>
      </Panel>
      <Panel p="sm">
        <Text size="xs" c="dimmed" tt="uppercase">
          Специалист зоны A
        </Text>
        <Text size="sm">
          {fame.zoneA ? `${fame.zoneA.label} · место зоны A лучше зоны B в ${fame.zoneA.times} из ${fame.zoneA.starts}` : 'Мало стартов, чтобы сравнивать берега'}
        </Text>
      </Panel>
    </Stack>
  )
}
