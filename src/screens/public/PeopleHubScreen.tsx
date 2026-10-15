import { SimpleGrid, Stack } from '@mantine/core'
import { IconUser, IconUsers } from '@tabler/icons-react'
import { ActionTile, PageHero } from '../../ui'

export function PeopleHubScreen() {
  return (
    <div className="pc-page">
      <Stack gap="lg">
        <PageHero title="Участники" subtitle="Справочник рыбаков и команд" />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <ActionTile
            to="/athletes"
            title="Рыбаки"
            description="Участники соревнований"
            icon={IconUser}
          />
          <ActionTile
            to="/teams"
            title="Команды"
            description="Составы и названия"
            icon={IconUsers}
          />
        </SimpleGrid>
      </Stack>
    </div>
  )
}
