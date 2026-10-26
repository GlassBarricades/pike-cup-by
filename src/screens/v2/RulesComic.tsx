import { Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { Panel } from '../../ui'
import { writeRulesSeen } from '../../features/tournament/v2Store'

const frames = [
  {
    title: 'Два берега',
    text: 'В первом туре стартовая группа ловит свою зону. Во втором туре группы меняются берегами.',
  },
  {
    title: 'Пять окон',
    text: 'Каждый тур — пять коротких мини-туров. Улов окна — это вес именно этого отрезка, не весь день.',
  },
  {
    title: 'Место в группе',
    text: 'Место считают среди команд, которые стояли на этом берегу вместе. Ничья по весу даёт среднее место. Ноль — место размером с группу или на одно больше, как решил турнир.',
  },
  {
    title: 'Сумма мест',
    text: 'В зачёт идёт сумма мест двух берегов. Больший вес сам по себе день не выигрывает: он только разводит равную сумму.',
  },
]

export function RulesComic({ onClose }: { onClose: () => void }) {
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
