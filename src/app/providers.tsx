import { ColorSchemeScript, MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AuthProvider } from '../features/auth/AuthProvider'
import { queryClient } from '../lib/queryClient'
import { theme } from '../theme'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications position="top-center" />
        <AuthProvider>{children}</AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  )
}
