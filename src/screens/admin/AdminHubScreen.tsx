import { SimpleGrid, Stack, Text } from '@mantine/core'
import { IconUserCog } from '@tabler/icons-react'
import { ActionTile, PageHeader } from '../../ui'

export function AdminHubScreen() {
  return (
    <Stack gap="lg">
      <PageHeader title="Кабинет админа" />
      <Text size="sm" c="dimmed">
        Системные настройки приложения: роли пользователей и доступ. Организация турнира — в штабе.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <ActionTile
          to="/admin/roles"
          title="Роли"
          description="Участник, судья, организатор, админ"
          icon={IconUserCog}
        />
      </SimpleGrid>
    </Stack>
  )
}
