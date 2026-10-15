import { Center, Loader, Stack, Text, Button } from '@mantine/core'
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
        <Loader color="depth" />
      </Center>
    )
  }

  if (!allow(role)) {
    return (
      <Stack gap="md" maw={420} mx="auto" py="xl">
        <Text fw={600}>Недостаточно прав</Text>
        <Text c="dimmed" size="sm">
          Этот раздел доступен только сотрудникам с нужной ролью. Обратитесь к администратору.
        </Text>
        <Button component={Link} to="/" variant="light" color="depth">
          На главную
        </Button>
      </Stack>
    )
  }

  return children
}
