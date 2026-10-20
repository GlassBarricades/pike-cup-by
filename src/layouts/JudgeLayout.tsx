import { Anchor, Group } from '@mantine/core'
import { Link, Outlet } from 'react-router-dom'
import { StaffTournamentProvider } from '../features/tournament/StaffTournamentContext'
import { BrandMark, ThemeToggle } from '../ui'

export function JudgeLayout() {
    return (
        <StaffTournamentProvider>
            <div
                style={{
                    minHeight: '100dvh',
                    background: 'var(--pc-bg)',
                    padding: '0.75rem',
                    paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                }}
            >
                <Group justify="space-between" mb="sm">
                    <BrandMark size="sm" link={false} />
                    <Group gap="sm">
                        <Anchor component={Link} to="/staff" size="sm" c="dimmed">
                            Штаб
                        </Anchor>
                        <ThemeToggle />
                    </Group>
                </Group>
                <Outlet />
            </div>
        </StaffTournamentProvider>
    )
}
