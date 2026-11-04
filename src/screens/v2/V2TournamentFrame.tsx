import { Button, Group, Stack, Text, Title } from '@mantine/core'
import { NavLink, Outlet } from 'react-router-dom'
import { useRefreshTournament } from '../../features/tournament/hooks'
import { useV2Tournament } from './context'

const links = [
  { to: '', label: 'Сейчас', end: true },
  { to: '/feed', label: 'Лента', end: false },
  { to: '/map', label: 'Карта', end: false },
  { to: '/table', label: 'Таблица', end: false },
  { to: '/matrix', label: 'Матрица', end: false },
  { to: '/schedule', label: 'День', end: false },
  { to: '/teams', label: 'Команды', end: false },
]

export function V2SectionNav() {
  const { tournament } = useV2Tournament()
  const { refresh, isFetching } = useRefreshTournament(tournament.id)
  const base = `/live/t/${tournament.id}`
  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
        <Title order={3} className="pc-display" style={{ minWidth: 0, flex: 1 }} lineClamp={2}>
          {tournament.name}
        </Title>
        <Button size="compact-sm" variant="light" color="signal" loading={isFetching} onClick={() => void refresh()}>
          Обновить
        </Button>
      </Group>
      <Group gap={6} wrap="nowrap" style={{ overflowX: 'auto' }}>
        {links.map((item) => (
          <NavLink
            key={item.label}
            to={`${base}${item.to}`}
            end={item.end}
            style={({ isActive }) => ({
              flex: '0 0 auto',
              padding: '6px 10px',
              border: '1px solid var(--pc-line)',
              background: 'var(--pc-panel)',
              color: isActive ? 'var(--pc-signal)' : 'inherit',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
            })}
          >
            <Text size="sm" inherit span>
              {item.label}
            </Text>
          </NavLink>
        ))}
      </Group>
    </Stack>
  )
}

export function V2TournamentFrame() {
  return (
    <Stack gap="md">
      <V2SectionNav />
      <Outlet />
    </Stack>
  )
}
