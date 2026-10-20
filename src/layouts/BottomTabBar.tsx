import { Box, Text, UnstyledButton } from '@mantine/core'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { getNavItems, isNavActive } from './navItems'

export function BottomTabBar() {
    const { pathname } = useLocation()
    const { role } = useAuth()
    const items = getNavItems(role)

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
            {items.map(({ to, label, icon: Icon, accent }) => {
                const active = isNavActive(pathname, to)
                const marked = Boolean(accent)
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
                            color: active || marked ? '#fff' : 'var(--pc-muted)',
                            background: marked ? 'var(--pc-signal)' : 'transparent',
                            textDecoration: 'none',
                        }}
                    >
                        <Icon size={22} stroke={active || marked ? 2 : 1.75} />
                        <Text size="xs" fw={active || marked ? 700 : 500} className="pc-display" style={{ fontSize: 11 }}>
                            {label}
                        </Text>
                    </UnstyledButton>
                )
            })}
        </Box>
    )
}
