import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router-dom'
import { Badge, Group, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core'
import { StaffTournamentPicker } from '../../components/StaffTournamentPicker'
import { PageFrame } from '../../components/PageFrame'
import { ScoreSurface } from '../../components/ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament, roleLabel } from '../../features/auth/permissions'
import { formatTournamentDate, statusLabel } from '../../features/tournament/date'
import {
  StaffTournamentProvider,
  useStaffTournament,
} from '../../features/tournament/StaffTournamentContext'
import { staffNavForRole } from './staffNav'

export function StaffLayout() {
  return (
    <StaffTournamentProvider>
      <StaffShell />
    </StaffTournamentProvider>
  )
}

function StaffShell() {
  const { role } = useAuth()
  const { selected } = useStaffTournament()
  const { pathname } = useLocation()
  const items = staffNavForRole(role)
  const isOrg = canManageTournament(role)

  return (
    <PageFrame>
      <Stack gap="md">
        <ScoreSurface
          p="md"
          style={{
            position: 'sticky',
            top: 8,
            zIndex: 5,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={800} size="lg">
                  {isOrg ? 'Организация' : 'Судейская'}
                </Text>
                <Text size="xs" c="dimmed">
                  {role ? roleLabel[role] : '—'}
                </Text>
              </div>
              {selected && (
                <Badge color={selected.status === 'finished' ? 'gray' : 'depth'} variant="filled">
                  {statusLabel[selected.status]}
                </Badge>
              )}
            </Group>

            <StaffTournamentPicker />

            {selected && (
              <Text size="sm" c="dimmed">
                Управляете: {selected.name} · {formatTournamentDate(selected.event_date)}
              </Text>
            )}

            <ScrollArea type="scroll" offsetScrollbars scrollbarSize={6}>
              <Group gap={6} wrap="nowrap" pb={2}>
                {items.map(({ to, short, icon: Icon }) => {
                  const active =
                    to === '/staff'
                      ? pathname === '/staff'
                      : pathname === to || pathname.startsWith(`${to}/`)

                  return (
                    <UnstyledButton
                      key={to}
                      component={RouterNavLink}
                      to={to}
                      end={to === '/staff'}
                      px="sm"
                      py={8}
                      style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        background: active
                          ? 'color-mix(in srgb, var(--mantine-color-depth-5) 16%, transparent)'
                          : 'transparent',
                        color: active
                          ? 'var(--mantine-color-depth-6)'
                          : 'var(--mantine-color-dimmed)',
                        border: '1px solid var(--pc-hairline)',
                        borderBottom: active
                          ? '2px solid var(--mantine-color-depth-5)'
                          : '2px solid transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        whiteSpace: 'nowrap',
                        textDecoration: 'none',
                        fontWeight: active ? 800 : 500,
                        fontSize: 13,
                      }}
                    >
                      <Icon size={16} stroke={1.75} />
                      {short}
                    </UnstyledButton>
                  )
                })}
              </Group>
            </ScrollArea>
          </Stack>
        </ScoreSurface>

        <Outlet />
      </Stack>
    </PageFrame>
  )
}
