import type { ReactNode } from 'react'
import { Box } from '@mantine/core'

/** Контейнер контента: узкий на телефоне, шире на ПК */
export function PageFrame({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <Box maw={wide ? 1200 : 720} mx="auto" w="100%">
      {children}
    </Box>
  )
}
