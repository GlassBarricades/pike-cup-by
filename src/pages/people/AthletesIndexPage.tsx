import { Box, Text, Stack } from '@mantine/core'
import { AthletesListPanel } from './AthletesListPanel'

export function AthletesIndexPage() {
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
            border: '1px dashed var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-md)',
            minHeight: 280,
            justifyContent: 'center',
          }}
        >
          <Text c="dimmed" ta="center">
            Выберите рыбака слева или добавьте нового
          </Text>
        </Stack>
      </Box>
    </>
  )
}
