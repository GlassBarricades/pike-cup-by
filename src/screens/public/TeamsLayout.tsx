import { Outlet } from 'react-router-dom'
import { Box, SimpleGrid } from '@mantine/core'
import { TeamsListPanel } from './TeamsListPanel'

export function TeamsLayout() {
  return (
    <div className="pc-page pc-page--wide">
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" style={{ alignItems: 'start' }}>
        <Box visibleFrom="md">
          <TeamsListPanel />
        </Box>
        <Box>
          <Outlet />
        </Box>
      </SimpleGrid>
    </div>
  )
}
