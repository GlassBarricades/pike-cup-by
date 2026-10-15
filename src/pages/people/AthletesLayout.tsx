import { Outlet } from 'react-router-dom'
import { Box, SimpleGrid } from '@mantine/core'
import { PageFrame } from '../../components/PageFrame'
import { AthletesListPanel } from './AthletesListPanel'

export function AthletesLayout() {
  return (
    <PageFrame wide>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Box visibleFrom="md">
          <AthletesListPanel />
        </Box>
        <Box>
          <Outlet />
        </Box>
      </SimpleGrid>
    </PageFrame>
  )
}
