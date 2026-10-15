import { Box, Stack, Text } from '@mantine/core'
import { TeamsListPanel } from './TeamsListPanel'

export function TeamsIndexPage() {
  return (
    <>
      <Box hiddenFrom="md">
        <TeamsListPanel />
      </Box>
      <Box visibleFrom="md">
        <Stack
          gap="xs"
          p="xl"
          style={{
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            minHeight: 280,
            justifyContent: 'center',
          }}
        >
          <Text c="dimmed" ta="center">
            Выберите команду слева или создайте новую
          </Text>
        </Stack>
      </Box>
    </>
  )
}
