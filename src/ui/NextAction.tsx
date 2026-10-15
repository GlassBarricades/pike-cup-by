import type { ReactNode } from 'react'
import { Alert, Button, Stack } from '@mantine/core'
import { Link } from 'react-router-dom'

export type NextActionProps = {
  title: string
  message?: string
  color?: string
  ctaLabel?: string
  ctaTo?: string
  onCtaClick?: () => void
  children?: ReactNode
}

export function NextAction({
  title,
  message,
  color = 'signal',
  ctaLabel,
  ctaTo,
  onCtaClick,
  children,
}: NextActionProps) {
  const cta =
    ctaLabel && ctaTo ? (
      <Button component={Link} to={ctaTo} size="sm" color={color} w="fit-content">
        {ctaLabel}
      </Button>
    ) : ctaLabel && onCtaClick ? (
      <Button size="sm" color={color} w="fit-content" onClick={onCtaClick}>
        {ctaLabel}
      </Button>
    ) : null

  return (
    <Alert color={color} title={title} variant="light" radius={0}>
      <Stack gap="xs">
        {message && <span>{message}</span>}
        {children}
        {cta}
      </Stack>
    </Alert>
  )
}
