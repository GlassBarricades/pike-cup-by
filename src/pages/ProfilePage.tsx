import { Button, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { isStaff, roleLabel } from '../features/auth/permissions'

export function ProfilePage() {
  const { user, profile, role, signOut } = useAuth()

  return (
    <Stack gap="md" maw={480} mx="auto">
      <Title order={2}>Профиль</Title>
      <Text c="dimmed">Вы вошли в PikeCup.</Text>
      <Text size="sm">
        Email:{' '}
        <Text span fw={600}>
          {user?.email}
        </Text>
      </Text>
      <Text size="sm">
        Роль:{' '}
        <Text span fw={600}>
          {role ? roleLabel[role] : '—'}
        </Text>
      </Text>
      {profile?.full_name && (
        <Text size="sm">
          Имя:{' '}
          <Text span fw={600}>
            {profile.full_name}
          </Text>
        </Text>
      )}
      {isStaff(role) && (
        <Button component={Link} to="/staff" color="depth">
          Организация
        </Button>
      )}
      <Button color="depth" variant="light" onClick={() => void signOut()}>
        Выйти
      </Button>
    </Stack>
  )
}
