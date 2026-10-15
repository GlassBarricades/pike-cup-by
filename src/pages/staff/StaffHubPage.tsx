import { Button, Group, SimpleGrid, Stack } from '@mantine/core'
import { Link } from 'react-router-dom'
import {
  IconChartBar,
  IconFishHook,
  IconMapPin,
  IconClipboardList,
  IconUsers,
  IconUser,
} from '@tabler/icons-react'
import { HubTile, SectionHead } from '../../components/ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { useEntries } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'

export function StaffHubPage() {
  const { role } = useAuth()
  const isOrg = canManageTournament(role)
  const { selected, tournaments } = useStaffTournament()
  const { data: entries = [] } = useEntries(selected?.id)

  if (!isOrg) {
    return (
      <Stack gap="md">
        <SectionHead
          title="Судейский день"
          description="Выберите турнир сверху, затем откройте «Улов» или «Время» для сдвига расписания."
        />
        <Group>
          <Button component={Link} to="/staff/catches" color="depth">
            Улов
          </Button>
          <Button component={Link} to="/staff/schedule" variant="outline" color="reed">
            Расписание
          </Button>
        </Group>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <SectionHead
        title="Кабинет"
        description="Справочник общий; заявки, зоны и регламент — для выбранного турнира."
      />

      {!selected && tournaments.length === 0 && (
        <Button component={Link} to="/staff/tournament" color="depth">
          Создать первый турнир
        </Button>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <HubTile to="/athletes" title="Рыбаки" description="Справочник участников" icon={IconUser} />
        <HubTile to="/teams" title="Команды" description="Составы и названия" icon={IconUsers} />
        <HubTile
          to="/staff/entries"
          title="Заявки"
          description={
            selected
              ? `«${selected.name}» · заявок: ${entries.length}`
              : 'Сначала выберите турнир'
          }
          icon={IconClipboardList}
          disabled={!selected}
        />
        <HubTile
          to="/staff/draw"
          title="Зоны"
          description="Стартовые зоны A / B"
          icon={IconMapPin}
          disabled={!selected}
        />
        <HubTile
          to="/staff/catches"
          title="Улов"
          description="Взвешивание и журнал"
          icon={IconFishHook}
          disabled={!selected}
        />
        <HubTile
          to={selected ? `/tournament/${selected.id}/results` : '/tournament'}
          title="Результаты"
          description="Протокол и live"
          icon={IconChartBar}
          disabled={!selected}
        />
      </SimpleGrid>

      {selected && (
        <Group>
          <Button component={Link} to={`/tournament/${selected.id}`} variant="outline" color="depth">
            Публичная страница
          </Button>
          <Button component={Link} to="/staff/tournament" variant="subtle" color="reed">
            Настройки турнира
          </Button>
        </Group>
      )}
    </Stack>
  )
}
