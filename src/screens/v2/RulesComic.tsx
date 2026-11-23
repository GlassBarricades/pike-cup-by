import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { zoneCodes, type TournamentFormat } from '../../features/tournament/formats'
import { writeRulesSeen } from '../../features/tournament/v2Store'
import { Panel } from '../../ui'

function pluralMinis(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} мини-тур`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} мини-тура`
  return `${n} мини-туров`
}

function buildFrames(format: TournamentFormat) {
  const codes = zoneCodes(format)
  const zonesLabel = codes.length > 0 ? codes.join(' / ') : '—'
  const miniCounts = [...new Set(format.structure.tours.map((t) => t.minis))]
  const minisText =
    miniCounts.length === 1
      ? pluralMinis(miniCounts[0]!)
      : format.structure.tours.map((t) => `тур ${t.number}: ${pluralMinis(t.minis)}`).join(', ')
  const rotation = format.structure.zoneRotation
  const shoresText =
    rotation === 'swap_pairs' && codes.length === 2
      ? `В первом туре стартовая группа ловит свою зону (${zonesLabel}). Во втором туре группы меняются берегами.`
      : rotation === 'cycle'
        ? `Зоны (${zonesLabel}) сменяют друг друга по кругу от тура к туру.`
        : rotation === 'fixed'
          ? `Каждая команда остаётся в своей зоне (${zonesLabel}) весь день.`
          : `Зоны турнира: ${zonesLabel}.`

  return [
    {
      title: codes.length === 2 ? 'Два берега' : 'Зоны',
      text: shoresText,
    },
    {
      title: miniCounts.length === 1 && miniCounts[0] === 5 ? 'Пять окон' : 'Окна ловли',
      text: `Каждый тур — ${minisText}. Улов окна — это вес именно этого отрезка, не весь день.`,
    },
    {
      title: 'Место в группе',
      text: 'Место считают среди команд, которые стояли на этом берегу вместе. Ничья по весу даёт среднее место. Ноль — место размером с группу или на одно больше, как решил турнир.',
    },
    {
      title: 'Сумма мест',
      text: 'В зачёт идёт сумма мест по зонам/турам. Больший вес сам по себе день не выигрывает: он только разводит равную сумму.',
    },
  ]
}

export function RulesComic({
  onClose,
  format,
}: {
  onClose: () => void
  format: TournamentFormat
}) {
  const frames = buildFrames(format)
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text className="pc-display" style={{ fontSize: '1.2rem' }}>
          Как читается день
        </Text>
        <Button
          size="xs"
          variant="light"
          color="signal"
          onClick={() => {
            writeRulesSeen()
            onClose()
          }}
        >
          Понятно
        </Button>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
        {frames.map((frame, index) => (
          <Panel key={frame.title} p="sm">
            <Text size="xs" c="dimmed" className="pc-display">
              {index + 1}
            </Text>
            <Text fw={700}>{frame.title}</Text>
            <Text size="sm" c="dimmed">
              {frame.text}
            </Text>
          </Panel>
        ))}
      </SimpleGrid>
    </Stack>
  )
}
