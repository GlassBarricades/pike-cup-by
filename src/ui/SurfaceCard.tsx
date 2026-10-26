import type { CSSProperties, ReactNode } from 'react'
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'
import type { CompetitionStage } from '../features/tournament/schedule'
import type { TournamentStatus } from '../features/tournament/types'
import { StageBadge, StatusBadge } from './StatusBadge'

const stripeColor: Record<TournamentStatus, string> = {
  draft: 'var(--mantine-color-gray-6)',
  published: 'var(--pc-muted)',
  live: 'var(--pc-signal)',
  finished: 'var(--mantine-color-gray-6)',
}

const stageStripe: Record<CompetitionStage, string> = {
  registration: 'var(--pc-muted)',
  live: 'var(--pc-signal)',
  completed: 'var(--mantine-color-gray-6)',
}

export function SurfaceCard({
  to,
  title,
  lines,
  status,
  stage,
  featured = false,
  right,
  style,
}: {
  to: string
  title: string
  lines?: ReactNode[]
  status?: TournamentStatus
  stage?: CompetitionStage
  featured?: boolean
  right?: ReactNode
  style?: CSSProperties
}) {
  const stripe = featured ? 'var(--pc-signal)' : stage ? stageStripe[stage] : status ? stripeColor[status] : undefined
  return (
    <UnstyledButton
      component={Link}
      to={to}
      style={{
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
        background: featured ? 'color-mix(in srgb, var(--pc-signal) 12%, var(--pc-panel))' : 'var(--pc-panel)',
        border: featured ? '1px solid var(--pc-signal)' : '1px solid var(--pc-line)',
        borderRadius: 'var(--pc-radius)',
        padding: '0.75rem 0.75rem 0.75rem 1rem',
        textDecoration: 'none',
        color: 'inherit',
        width: '100%',
        ...style,
      }}
    >
      {stripe && (
        <Box
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: stripe,
          }}
        />
      )}
      <Group justify="space-between" wrap="nowrap" align="flex-start" gap="sm">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} lineClamp={2}>
            {title}
          </Text>
          {lines && lines.length > 0 && (
            <Stack gap={2} mt={4}>
              {lines.map((line, i) => (
                <Text key={i} size="sm" c="dimmed" lineClamp={1}>
                  {line}
                </Text>
              ))}
            </Stack>
          )}
        </div>
        <Stack gap={6} align="flex-end" style={{ flexShrink: 0 }}>
          {right}
          {stage ? <StageBadge stage={stage} size="sm" /> : status ? <StatusBadge status={status} size="sm" /> : null}
        </Stack>
      </Group>
    </UnstyledButton>
  )
}
