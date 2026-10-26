import { Box, Text, UnstyledButton } from '@mantine/core'
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'
import { useReviewNavTo, useShowLiveNav } from '../features/tournament/hooks'
import { getNavItems, isNavActive } from './navItems'

export function BottomTabBar() {
    const { pathname } = useLocation()
    const { role } = useAuth()
    const live = useShowLiveNav()
    const reviewTo = useReviewNavTo()
    const items = getNavItems(role, { live, reviewTo })

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
            {items.map(({ to, label, icon: Icon, accent, pulse }) => {
                const active = isNavActive(pathname, to)
                const marked = Boolean(accent)
                const pulsing = Boolean(pulse)
                return (
                    <UnstyledButton
                        key={to}
                        component={RouterNavLink}
                        to={to}
                        className={pulsing ? 'pc-nav-live' : undefined}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 2,
                            minHeight: 56,
                            color: pulsing ? 'var(--pc-live)' : active || marked ? '#fff' : 'var(--pc-muted)',
                            background: pulsing
                                ? active
                                    ? 'color-mix(in srgb, var(--pc-live) 14%, transparent)'
                                    : 'transparent'
                                : marked
                                  ? 'var(--pc-signal)'
                                  : 'transparent',
                            textDecoration: 'none',
                        }}
                    >
                        <Icon size={22} stroke={active || marked || pulsing ? 2 : 1.75} />
                        <Text size="xs" fw={active || marked || pulsing ? 700 : 500} className="pc-display" style={{ fontSize: 11 }}>
                            {label}
                        </Text>
                    </UnstyledButton>
                )
            })}
        </Box>
    )
}
