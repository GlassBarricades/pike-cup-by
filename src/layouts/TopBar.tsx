import { ActionIcon, Avatar, Button, Group, Text } from '@mantine/core'
import { IconClipboardList, IconSettings } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { canManageRoles, isStaff } from '../features/auth/permissions'
import { useActiveTournament } from '../features/tournament/hooks'
import { BrandMark, LiveBadge, ThemeToggle } from '../ui'

export function TopBar() {
  const { data: active } = useActiveTournament()
  const { user, profile, role, loading } = useAuth()
  const location = useLocation()
  const showLive = active?.status === 'live'
  const showStaff = isStaff(role)
  const showAdmin = canManageRoles(role)

  return (
    <Group
      h={52}
      px="md"
      justify="space-between"
      wrap="nowrap"
      style={{
        borderBottom: '1px solid var(--pc-line)',
        background: 'var(--pc-bg)',
      }}
    >
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
        <BrandMark size="sm" />
        {showLive && <LiveBadge />}
        <Text size="xs" c="dimmed" visibleFrom="sm">
          Беларусь
        </Text>
      </Group>

      <Group gap="xs" wrap="nowrap">
        {!loading && showStaff && (
          <>
            <ActionIcon
              component={Link}
              to="/staff"
              variant="subtle"
              color="gray"
              size="lg"
              hiddenFrom="sm"
              aria-label="Пульт штаба"
            >
              <IconClipboardList size={20} />
            </ActionIcon>
            <Button
              component={Link}
              to="/staff"
              variant="subtle"
              color="gray"
              size="compact-sm"
              leftSection={<IconClipboardList size={16} />}
              visibleFrom="sm"
            >
              Штаб
            </Button>
          </>
        )}
        {!loading && showAdmin && (
          <>
            <ActionIcon
              component={Link}
              to="/admin"
              variant="subtle"
              color="gray"
              size="lg"
              hiddenFrom="sm"
              aria-label="Пульт админа"
            >
              <IconSettings size={20} />
            </ActionIcon>
            <Button
              component={Link}
              to="/admin"
              variant="subtle"
              color="gray"
              size="compact-sm"
              leftSection={<IconSettings size={16} />}
              visibleFrom="sm"
            >
              Админ
            </Button>
          </>
        )}
        <ThemeToggle />
        {!loading &&
          (user ? (
            <Avatar
              component={Link}
              to="/profile"
              radius="xl"
              size="sm"
              color="signal"
              aria-label="Профиль"
            >
              {(profile?.full_name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
            </Avatar>
          ) : (
            <Button
              component={Link}
              to="/login"
              state={{ from: location }}
              variant="light"
              color="signal"
              size="compact-sm"
            >
              Войти
            </Button>
          ))}
      </Group>
    </Group>
  )
}
