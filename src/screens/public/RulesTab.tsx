import { Stack, Text } from '@mantine/core'
import type { Tournament } from '../../features/tournament/types'
import { Panel } from '../../ui'

export function RulesTab({ tournament }: { tournament: Tournament }) {
  const blocks = tournament.rules_content.split('\n').filter((line) => line.trim().length > 0)

  return (
    <Stack gap="sm">
      <Text size="xs" c="dimmed">
        {tournament.rules_locked_at
          ? 'Зафиксирован для турнира'
          : 'Черновик — организатор ещё может внести правки'}
      </Text>
      <Panel>
        <Stack gap="xs">
          {blocks.length === 0 ? (
            <Text c="dimmed" size="sm">
              Регламент пока пуст
            </Text>
          ) : (
            blocks.map((line, index) => {
              const trimmed = line.trim()
              if (trimmed.startsWith('# ')) {
                return (
                  <Text
                    key={index}
                    className="pc-display"
                    style={{ fontSize: '1.35rem' }}
                    mt={index ? 'sm' : 0}
                  >
                    {trimmed.slice(2)}
                  </Text>
                )
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <Text key={index} fw={700} mt="xs">
                    {trimmed.slice(3)}
                  </Text>
                )
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <Text key={index} size="sm" pl="sm">
                    • {trimmed.slice(2)}
                  </Text>
                )
              }
              return (
                <Text key={index} size="sm">
                  {trimmed}
                </Text>
              )
            })
          )}
        </Stack>
      </Panel>
    </Stack>
  )
}
