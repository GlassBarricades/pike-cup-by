import { useState } from 'react'
import {
  Anchor,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark, Panel, ThemeToggle } from '../../ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { loginSchema, zodFormErrors } from '../../features/auth/schemas'
import { isSupabaseConfigured } from '../../lib/env'
import { canJudgeDay } from '../../features/auth/permissions'
import { useZoneJudges, useActiveTournament } from '../../features/tournament/hooks'

export function LoginScreen() {
  const { signIn, session, loading, role, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { data: active } = useActiveTournament()
  const { data: zoneJudges = [] } = useZoneJudges(
    session && canJudgeDay(role) && role === 'judge' ? active?.id : undefined,
  )

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : null

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => zodFormErrors(loginSchema, values),
  })

  if (!loading && session) {
    const assigned =
      role === 'judge' && active && zoneJudges.some((j) => j.user_id === user?.id)
    const dest = from ?? (assigned ? '/staff/console' : '/profile')
    return <Navigate to={dest} replace />
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitError(null)
    setSubmitting(true)
    const { error } = await signIn(values.email, values.password)
    setSubmitting(false)
    if (error) {
      setSubmitError(error)
      return
    }
    navigate(from ?? '/profile', { replace: true })
  })

  return (
    <div className="pc-page pc-page--narrow" style={{ minHeight: '100dvh', paddingTop: '2rem' }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <BrandMark size="lg" />
            <Text c="dimmed" mt={4} size="sm">
              Вход в аккаунт
            </Text>
          </div>
          <ThemeToggle />
        </Group>

        <Panel>
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              {!isSupabaseConfigured && (
                <Text size="sm" c="signal">
                  Укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env
                </Text>
              )}
              <TextInput label="Email" autoComplete="email" {...form.getInputProps('email')} />
              <PasswordInput
                label="Пароль"
                autoComplete="current-password"
                {...form.getInputProps('password')}
              />
              {submitError && (
                <Text size="sm" c="red">
                  {submitError}
                </Text>
              )}
              <Button type="submit" color="signal" loading={submitting} fullWidth>
                Войти
              </Button>
            </Stack>
          </form>
        </Panel>

        <Text size="sm" ta="center">
          Нет аккаунта?{' '}
          <Anchor component={Link} to="/register" c="signal">
            Зарегистрироваться
          </Anchor>
        </Text>
      </Stack>
    </div>
  )
}
