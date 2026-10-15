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
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/ui'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../features/auth/AuthProvider'
import { registerSchema, zodFormErrors } from '../features/auth/schemas'
import { isSupabaseConfigured } from '../lib/env'

export function RegisterPage() {
  const { signUp, session, loading } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitInfo, setSubmitInfo] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validate: (values) => zodFormErrors(registerSchema, values),
  })

  if (!loading && session) {
    return <Navigate to="/profile" replace />
  }

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitError(null)
    setSubmitInfo(null)
    setSubmitting(true)
    const { error } = await signUp(values.email, values.password)
    setSubmitting(false)

    if (error) {
      setSubmitError(error)
      return
    }

    setSubmitInfo('Проверьте email для подтверждения, затем войдите.')
    navigate('/login', { replace: true })
  })

  return (
    <Container size={420} py="xl" style={{ minHeight: '100dvh' }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <BrandMark size="lg" />
            <Text c="dimmed" mt={4}>
              Регистрация участника
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
                autoComplete="new-password"
                {...form.getInputProps('password')}
              />
              <PasswordInput
                label="Повторите пароль"
                autoComplete="new-password"
                {...form.getInputProps('confirmPassword')}
              />
              {submitError && (
                <Text size="sm" c="red">
                  {submitError}
                </Text>
              )}
              {submitInfo && (
                <Text size="sm" c="reed.6">
                  {submitInfo}
                </Text>
              )}
              <Button type="submit" color="depth" loading={submitting} fullWidth>
                Создать аккаунт
              </Button>
            </Stack>
          </form>
        </Paper>

        <Text size="sm" ta="center">
          Уже есть аккаунт?{' '}
          <Anchor component={Link} to="/login" c="depth.6">
            Войти
          </Anchor>
        </Text>
      </Stack>
    </Container>
  )
}
