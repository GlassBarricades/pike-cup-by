import { Group, UnstyledButton } from '@mantine/core'
import { Link, useLocation } from 'react-router-dom'
import { ScoreSurface } from './ScoreSurface'

export type TournamentTab = {
  to: string
  label: string
  end?: boolean
}

export function TournamentTabs({ tabs }: { tabs: TournamentTab[] }) {
  const { pathname } = useLocation()

  return (
    <ScoreSurface p={0}>
      <Group gap={0} wrap="nowrap" style={{ overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const active = tab.end
            ? pathname === tab.to
            : pathname === tab.to || pathname.startsWith(`${tab.to}/`)
          return (
            <UnstyledButton
              key={tab.to}
              component={Link}
              to={tab.to}
              px="md"
              py="sm"
              className={active ? 'pc-tab-active' : undefined}
              style={{
                whiteSpace: 'nowrap',
                borderBottom: '2px solid transparent',
                color: active ? undefined : 'var(--mantine-color-dimmed)',
                fontWeight: active ? 800 : 600,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              {tab.label}
            </UnstyledButton>
          )
        })}
      </Group>
    </ScoreSurface>
  )
}
