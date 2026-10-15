import { useState } from 'react'
import {
  Anchor,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../features/auth/AuthProvider'
import { loginSchema, zodFormErrors } from '../features/auth/schemas'
import { isSupabaseConfigured } from '../lib/env'

export function LoginPage() {
  const { signIn, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/profile'

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => zodFormErrors(loginSchema, values),
  })

  if (!loading && session) {
    return <Navigate to={from} replace />
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

    navigate(from, { replace: true })
  })

  return (
    <Container size={420} py="xl" style={{ minHeight: '100dvh' }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <BrandMark size="lg" />
            <Text c="dimmed" mt={4}>
              Вход в аккаунт участника
            </Text>
          </div>
          <ThemeToggle />
        </Group>

        <Paper p="md" radius="md" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              {!isSupabaseConfigured && (
                <Text size="sm" c="orange">
                  Укажите VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env
                </Text>
              )}
              <TextInput
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                {...form.getInputProps('email')}
              />
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
              <Button type="submit" color="depth" loading={submitting} fullWidth>
                Войти
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text size="sm" ta="center">
          Нет аккаунта?{' '}
          <Anchor component={Link} to="/register" c="depth.6">
            Зарегистрироваться
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}
