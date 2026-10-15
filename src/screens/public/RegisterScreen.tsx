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
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark, Panel, ThemeToggle } from '../../ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { registerSchema, zodFormErrors } from '../../features/auth/schemas'
import { isSupabaseConfigured } from '../../lib/env'

export function RegisterScreen() {
  const { signUp, session, loading } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
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
    setSubmitting(true)
    const { error } = await signUp(values.email, values.password)
    setSubmitting(false)
    if (error) {
      setSubmitError(error)
      return
    }
    navigate('/login', { replace: true })
  })

  return (
    <div className="pc-page pc-page--narrow" style={{ minHeight: '100dvh', paddingTop: '2rem' }}>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <BrandMark size="lg" />
            <Text c="dimmed" mt={4} size="sm">
              Регистрация
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
              <PasswordInput label="Пароль" autoComplete="new-password" {...form.getInputProps('password')} />
              <PasswordInput
                label="Ещё раз"
                autoComplete="new-password"
                {...form.getInputProps('confirmPassword')}
              />
              {submitError && (
                <Text size="sm" c="red">
                  {submitError}
                </Text>
              )}
              <Button type="submit" color="signal" loading={submitting} fullWidth>
                Зарегистрироваться
              </Button>
            </Stack>
          </form>
        </Panel>

        <Text size="sm" ta="center">
          Уже есть аккаунт?{' '}
          <Anchor component={Link} to="/login" c="signal">
            Войти
          </Anchor>
        </Text>
      </Stack>
    </div>
  )
}
