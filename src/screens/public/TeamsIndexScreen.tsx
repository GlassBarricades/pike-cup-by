import { Box, Stack, Text } from '@mantine/core'
import { TeamsListPanel } from './TeamsListPanel'

export function TeamsIndexScreen() {
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
            border: '1px dashed var(--pc-line)',
            borderRadius: 'var(--pc-radius)',
            minHeight: 280,
            justifyContent: 'center',
          }}
        >
          <Text c="dimmed" ta="center">
            Выберите команду слева
          </Text>
        </Stack>
      </Box>
    </>
  )
}
