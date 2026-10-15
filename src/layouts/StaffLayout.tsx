import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Group,
  Select,
  Stack,
  Text,
  UnstyledButton,
  useMantineTheme,
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import {
  IconClipboardList,
  IconClock,
  IconDeviceGamepad2,
  IconFishHook,
  IconFlagCheck,
  IconHome,
  IconSettings,
  IconTournament,
  IconUsers,
  IconUsersGroup,
  IconFileText,
} from '@tabler/icons-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { canManageRoles, canManageTournament, roleLabel } from '../features/auth/permissions'
import { formatTournamentDate, statusLabel } from '../features/tournament/date'
import {
  StaffTournamentProvider,
  useStaffTournament,
} from '../features/tournament/StaffTournamentContext'

type NavItem = {
  to: string
  label: string
  icon: typeof IconHome
  orgOnly?: boolean
}

const staffNav: NavItem[] = [
  { to: '/staff', label: 'Обзор', icon: IconClipboardList },
  { to: '/staff/tournament', label: 'Турнир', icon: IconTournament, orgOnly: true },
  { to: '/staff/rules', label: 'Регламент', icon: IconFileText, orgOnly: true },
  { to: '/staff/entries', label: 'Заявки', icon: IconUsersGroup, orgOnly: true },
  { to: '/staff/draw', label: 'Жеребьёвка', icon: IconUsers, orgOnly: true },
  { to: '/staff/judges', label: 'Судьи', icon: IconUsers, orgOnly: true },
  { to: '/staff/day', label: 'День', icon: IconClock },
  { to: '/staff/catches', label: 'Журнал', icon: IconFishHook, orgOnly: true },
  { to: '/staff/finish', label: 'Итоги', icon: IconFlagCheck, orgOnly: true },
  { to: '/staff/console', label: 'Пульт судьи', icon: IconDeviceGamepad2 },
]

function navActive(pathname: string, to: string) {
  if (to === '/staff') return pathname === '/staff' || pathname === '/staff/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function StaffLayout() {
  return (
    <StaffTournamentProvider>
      <StaffChrome />
    </StaffTournamentProvider>
  )
}

function StaffChrome() {
  const theme = useMantineTheme()
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`)
  const [opened, { toggle, close }] = useDisclosure(false)
  const { user, profile, role } = useAuth()
  const { selected, tournaments, selectedId, setSelectedId, loading } = useStaffTournament()
  const { pathname } = useLocation()
  const isOrg = canManageTournament(role)
  const showAdmin = canManageRoles(role)
  const title = isOrg ? 'Пульт штаба' : 'Судейская'

  const visibleNav = staffNav.filter((item) => !item.orgOnly || isOrg)

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
            <UnstyledButton component={Link} to="/staff" style={{ minWidth: 0 }} onClick={close}>
              <Text fw={700} size="lg" c="signal" className="pc-display" lineClamp={1}>
                {title}
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
        <Stack gap="md" h="100%">
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              {role ? roleLabel[role] : '—'}
              {selected ? ` · ${selected.name}` : ''}
            </Text>
            {loading ? (
              <Text size="sm" c="dimmed">
                Загрузка турниров…
              </Text>
            ) : (
              <Select
                label="Турнир"
                placeholder={tournaments.length ? 'Выберите турнир' : 'Сначала создайте турнир'}
                data={tournaments.map((t) => ({
                  value: t.id,
                  label: `${formatTournamentDate(t.event_date)} · ${t.name} (${statusLabel[t.status]})`,
                }))}
                value={selectedId}
                onChange={(v) => setSelectedId(v)}
                searchable
                clearable={false}
                size="xs"
              />
            )}
          </div>

          <Stack gap="xs" style={{ flex: 1 }}>
            {visibleNav.map((item) => {
              const active = navActive(pathname, item.to)
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
            {showAdmin && (
              <Button
                component={Link}
                to="/admin"
                variant="subtle"
                color="gray"
                justify="flex-start"
                leftSection={<IconSettings size={18} />}
                onClick={close}
              >
                Пульт админа
              </Button>
            )}
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
