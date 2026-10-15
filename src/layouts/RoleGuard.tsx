import { Button, Center, Loader, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import type { AppRole } from '../features/auth/types'
import { AuthGuard } from './AuthGuard'

export function RoleGuard({
  allow,
  children,
}: {
  allow: (role: AppRole | null) => boolean
  children: ReactNode
}) {
  return (
    <AuthGuard>
      <RoleGuardInner allow={allow}>{children}</RoleGuardInner>
    </AuthGuard>
  )
}

function RoleGuardInner({
  allow,
  children,
}: {
  allow: (role: AppRole | null) => boolean
  children: ReactNode
}) {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <Center mih={240}>
        <Loader color="signal" />
      </Center>
    )
  }

  if (!allow(role)) {
    return (
      <Stack gap="md" maw={420} mx="auto" py="xl" className="pc-page">
        <Text fw={600} className="pc-display" style={{ fontSize: '1.4rem' }}>
          Недостаточно прав
        </Text>
        <Text c="dimmed" size="sm">
          Этот раздел доступен только сотрудникам с нужной ролью.
        </Text>
        <Button component={Link} to="/" variant="light" color="signal">
          На главную
        </Button>
      </Stack>
    )
  }

  return children
}
