import { Box, Text, UnstyledButton } from '@mantine/core'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { getNavItems, isNavActive } from './navItems'

export function BottomTabBar() {
  const { pathname } = useLocation()
  const items = getNavItems()

  return (
    <Box
      component="nav"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        height: '100%',
        borderTop: '1px solid var(--pc-line)',
        background: 'var(--pc-panel)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {items.map(({ to, label, icon: Icon }) => {
        const active = isNavActive(pathname, to)
        return (
          <UnstyledButton
            key={to}
            component={RouterNavLink}
            to={to}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              minHeight: 56,
              color: active ? 'var(--pc-signal)' : 'var(--pc-muted)',
              textDecoration: 'none',
            }}
          >
            <Icon size={22} stroke={active ? 2 : 1.75} />
            <Text size="xs" fw={active ? 700 : 500} className="pc-display" style={{ fontSize: 11 }}>
              {label}
            </Text>
          </UnstyledButton>
        )
      })}
    </Box>
  )
}
