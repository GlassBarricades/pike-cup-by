import { Button, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageRoles, isStaff, roleLabel } from '../../features/auth/permissions'
import { PageHero, Panel } from '../../ui'

export function ProfileScreen() {
  const { user, profile, role, signOut } = useAuth()

  return (
    <div className="pc-page pc-page--narrow">
      <Stack gap="lg">
        <PageHero title="Профиль" subtitle="Аккаунт PikeCup" />

        <Panel>
          <Stack gap="sm">
            <Text size="sm">
              Email:{' '}
              <Text span fw={600}>
                {user?.email}
              </Text>
            </Text>
            <Text size="sm">
              Роль:{' '}
              <Text span fw={600} className="pc-display">
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
          </Stack>
        </Panel>

        <Group>
          {isStaff(role) && (
            <Button component={Link} to="/staff" color="signal">
              Штаб
            </Button>
          )}
          {canManageRoles(role) && (
            <Button component={Link} to="/admin" variant="outline" color="signal">
              Админ
            </Button>
          )}
        </Group>

        <Button color="gray" variant="light" onClick={() => void signOut()}>
          Выйти
        </Button>
      </Stack>
    </div>
  )
}
