import { Group, Stack, Text, Title } from '@mantine/core'
import { NavLink, Outlet } from 'react-router-dom'
import { SpectatorRefreshBar } from '../../ui'
import { useV2Tournament } from './context'

const links = [
  { to: '/now', label: 'Сейчас', end: true },
  { to: '/feed', label: 'Лента', end: true },
  {
    to: '/map',
    label: 'Карта',
    end: false,
    hint: 'черновик',
    title: 'Карта ещё дорабатывается — пока сырое решение',
  },
  { to: '/table', label: 'Таблица', end: false },
  { to: '/matrix', label: 'Матрица', end: false },
  { to: '/schedule', label: 'День', end: false },
  { to: '/teams', label: 'Команды', end: false },
]

export function V2SectionNav() {
  const { tournament } = useV2Tournament()
  const base = `/live/t/${tournament.id}`
  return (
    <Stack gap="sm">
      <Title order={3} className="pc-display" lineClamp={2}>
        {tournament.name}
      </Title>
      <Group gap={6} wrap="nowrap" style={{ overflowX: 'auto' }}>
        {links.map((item) => (
          <NavLink
            key={item.label}
            to={`${base}${item.to}`}
            end={item.end}
            title={'title' in item ? item.title : undefined}
            style={({ isActive }) => ({
              flex: '0 0 auto',
              padding: '6px 10px',
              border: '1px solid var(--pc-line)',
              background: 'var(--pc-panel)',
              color: isActive ? 'var(--pc-signal)' : 'inherit',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              opacity: 'hint' in item && item.hint ? 0.85 : undefined,
            })}
          >
            <Text size="sm" inherit span>
              {item.label}
              {'hint' in item && item.hint ? (
                <Text span size="xs" c="dimmed" ml={4} style={{ fontWeight: 600 }}>
                  {item.hint}
                </Text>
              ) : null}
            </Text>
          </NavLink>
        ))}
      </Group>
    </Stack>
  )
}

export function V2TournamentFrame() {
  const { tournament } = useV2Tournament()
  return (
    <Stack gap="md" pb="calc(5.5rem + env(safe-area-inset-bottom))">
      <V2SectionNav />
      <Outlet />
      <SpectatorRefreshBar tournamentId={tournament.id} />
    </Stack>
  )
}
