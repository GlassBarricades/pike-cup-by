import { Button, Stack, Text, UnstyledButton } from '@mantine/core'
import {
  IconClipboardList,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react'
import { Link, NavLink as RouterNavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { canManageRoles, isStaff } from '../features/auth/permissions'
import { getNavItems, isNavActive } from './navItems'

export function SideRail() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { role, user, signOut } = useAuth()
  const items = getNavItems()

  return (
    <Stack gap={4} p="sm" component="nav" h="100%" justify="space-between">
      <Stack gap={4}>
        {items.map(({ to, label, icon: Icon }) => {
          const active = isNavActive(pathname, to)
          return (
            <UnstyledButton
              key={to}
              component={RouterNavLink}
              to={to}
              end={to === '/'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 'var(--pc-radius)',
                background: active
                  ? 'color-mix(in srgb, var(--pc-signal) 14%, transparent)'
                  : 'transparent',
                color: active ? 'var(--pc-signal)' : 'var(--pc-muted)',
                textDecoration: 'none',
                borderLeft: active ? '2px solid var(--pc-signal)' : '2px solid transparent',
              }}
            >
              <Icon size={20} stroke={active ? 2 : 1.75} />
              <Text size="sm" fw={active ? 700 : 500} className="pc-display">
                {label}
              </Text>
            </UnstyledButton>
          )
        })}

        {isStaff(role) && (
          <Button
            component={Link}
            to="/staff"
            variant="subtle"
            color="gray"
            justify="flex-start"
            leftSection={<IconClipboardList size={18} />}
            mt="md"
          >
            Пульт штаба
          </Button>
        )}
        {canManageRoles(role) && (
          <Button
            component={Link}
            to="/admin"
            variant="subtle"
            color="gray"
            justify="flex-start"
            leftSection={<IconSettings size={18} />}
          >
            Пульт админа
          </Button>
        )}
      </Stack>

      {user && (
        <Button
          variant="light"
          color="red"
          justify="flex-start"
          leftSection={<IconLogout size={18} />}
          onClick={async () => {
            await signOut()
            navigate('/login')
          }}
        >
          Выйти
        </Button>
      )}
    </Stack>
  )
}
