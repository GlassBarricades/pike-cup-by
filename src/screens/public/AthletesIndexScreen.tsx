import { Box, Stack, Text } from '@mantine/core'
import { AthletesListPanel } from './AthletesListPanel'

export function AthletesIndexScreen() {
  return (
    <>
      <Box hiddenFrom="md">
        <AthletesListPanel />
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
            Выберите рыбака слева
          </Text>
        </Stack>
      </Box>
    </>
  )
}
