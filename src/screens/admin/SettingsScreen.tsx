import { Stack, Switch, Text } from '@mantine/core'
import { PageHeader, Panel } from '../../ui'
import { useAppSettings, useUpdateHideRegistration } from '../../features/settings/hooks'

export function SettingsScreen() {
  const { data: settings, isLoading, isError, error } = useAppSettings()
  const mutation = useUpdateHideRegistration()

  const hideRegistration = settings?.hide_registration ?? false

  return (
    <Stack gap="lg" w="100%">
      <div>
        <PageHeader title="Настройки" />
        <Text size="sm" c="dimmed" mt={4}>
          Системные переключатели приложения. Вход в аккаунт всегда остаётся доступен.
        </Text>
      </div>

      {isLoading ? (
        <Text c="dimmed" size="sm">
          Загрузка…
        </Text>
      ) : isError ? (
        <Text c="red" size="sm">
          {(error as Error).message}
        </Text>
      ) : (
        <Panel>
          <Switch
            label="Скрыть кнопку регистрации"
            description="На экране входа останется только «Войти». Прямая ссылка /register тоже будет недоступна."
            checked={hideRegistration}
            disabled={mutation.isPending}
            onChange={(e) => mutation.mutate(e.currentTarget.checked)}
          />
          {mutation.isError && (
            <Text c="red" size="sm" mt="sm">
              {(mutation.error as Error).message}
            </Text>
          )}
        </Panel>
      )}
    </Stack>
  )
}
