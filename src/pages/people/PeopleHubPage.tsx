import { SimpleGrid, Stack } from '@mantine/core'
import { IconUser, IconUsers } from '@tabler/icons-react'
import { PageFrame } from '../../components/PageFrame'
import { HubTile, SectionHead } from '../../components/ui'

export function PeopleHubPage() {
  return (
    <PageFrame>
      <Stack gap="lg">
        <SectionHead
          title="Участники"
          description="Глобальный справочник рыбаков и команд Pike Cup"
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <HubTile
            to="/athletes"
            title="Рыбаки"
            description="Все спортсмены и их страницы"
            icon={IconUser}
          />
          <HubTile
            to="/teams"
            title="Команды"
            description="Составы и история участий"
            icon={IconUsers}
          />
        </SimpleGrid>
      </Stack>
    </PageFrame>
  )
}
