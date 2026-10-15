import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Group,
  Stack,
  Text,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconClipboardList,
  IconHome,
  IconLayoutDashboard,
  IconUserCog,
} from '@tabler/icons-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { isStaff } from '../features/auth/permissions'

type NavItem = {
  to: string
  label: string
  icon: typeof IconHome
  exact?: boolean
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Обзор', icon: IconLayoutDashboard, exact: true },
  { to: '/admin/roles', label: 'Пользователи и роли', icon: IconUserCog },
]

function navActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to || pathname === `${item.to}/`
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function AdminLayout() {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [opened, { toggle, close }] = useDisclosure(false)
  const { user, profile, role } = useAuth()
  const { pathname } = useLocation()
  const showStaff = isStaff(role)

  return (
    <AppShell
      header={{ height: 52 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: { minHeight: '100dvh', background: 'var(--pc-bg)' },
        header: {
          background: 'var(--pc-bg)',
          borderBottom: '1px solid var(--pc-line)',
        },
        navbar: {
          background: 'var(--pc-bg)',
          borderRight: '1px solid var(--pc-line)',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={opened ? 'Закрыть меню' : 'Открыть меню'}
            />
            <UnstyledButton component={Link} to="/admin" style={{ minWidth: 0 }} onClick={close}>
              <Text fw={700} size="lg" c="signal" className="pc-display" lineClamp={1}>
                Пульт админа
              </Text>
            </UnstyledButton>
          </Group>
          {user && (
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
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs" h="100%" justify="space-between">
          <Stack gap="xs">
            {adminNav.map((item) => {
              const active = navActive(pathname, item)
              const Icon = item.icon
              return (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  variant={active ? 'light' : 'subtle'}
                  color={active ? 'signal' : 'gray'}
                  justify="flex-start"
                  leftSection={<Icon size={18} />}
                  onClick={close}
                >
                  {item.label}
                </Button>
              )
            })}
          </Stack>
          <Stack gap="xs">
            {showStaff && (
              <Button
                component={Link}
                to="/staff"
                variant="subtle"
                color="gray"
                justify="flex-start"
                leftSection={<IconClipboardList size={18} />}
                onClick={close}
              >
                Пульт штаба
              </Button>
            )}
            <Button
              component={Link}
              to="/"
              variant="subtle"
              color="gray"
              justify="flex-start"
              leftSection={<IconHome size={18} />}
              onClick={close}
            >
              К приложению
            </Button>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      {isMobile && opened && (
        <Box
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 90,
          }}
        />
      )}

      <AppShell.Main>
        <Box maw={{ base: '100%', sm: 720, xl: 1200 }} mx="auto" w="100%">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  )
}
