import { useState } from 'react'
import { Anchor, Button, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { IconPencil } from '@tabler/icons-react'
import { Link, useParams } from 'react-router-dom'
import { EditTournamentModal } from '../../components/EditTournamentModal'
import { TournamentShell } from '../../components/TournamentShell'
import { HubTile, ScoreSurface, SectionHead } from '../../components/ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { canJudgeDay, canManageTournament } from '../../features/auth/permissions'
import { useTournament } from '../../features/tournament/hooks'

export function TournamentHubPage() {
  const { tournamentId } = useParams()
  const { data: tournament, isLoading } = useTournament(tournamentId)
  const { role } = useAuth()
  const showStaff = canJudgeDay(role)
  const canEdit = canManageTournament(role)
  const isFinished = tournament?.status === 'finished'
  const [editOpened, setEditOpened] = useState(false)

  if (isLoading) {
    return <Text c="dimmed">Загрузка…</Text>
  }

  if (!tournament) {
    return (
      <Stack gap="sm">
        <Text>Турнир не найден</Text>
        <Anchor component={Link} to="/tournament" c="depth">
          К списку турниров
        </Anchor>
      </Stack>
    )
  }

  return (
    <TournamentShell tournament={tournament}>
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <SectionHead
          title="Обзор"
          description={
            tournament.organizers?.length
              ? `Оргкомитет: ${tournament.organizers.join(', ')}`
              : 'Разделы турнира — во вкладках выше'
          }
          order={3}
        />
        {canEdit && (
          <Button
            color="depth"
            variant="outline"
            leftSection={<IconPencil size={16} />}
            onClick={() => setEditOpened(true)}
          >
            Изменить
          </Button>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <HubTile
          to={`/tournament/${tournament.id}/results`}
          title={isFinished ? 'Протокол' : 'Live-протокол'}
          description={isFinished ? 'Итоговая таблица' : 'Ход и взвешивания'}
        />
        <HubTile
          to={`/tournament/${tournament.id}/schedule`}
          title="Расписание"
          description="Этапы дня"
        />
        <HubTile
          to={`/tournament/${tournament.id}/teams`}
          title="Команды"
          description="Составы на турнир"
        />
        <HubTile
          to={`/tournament/${tournament.id}/rules`}
          title="Регламент"
          description="Правила турнира"
        />
      </SimpleGrid>

      {showStaff && (
        <ScoreSurface p="sm">
          <Text size="sm">
            Управление днём — в разделе{' '}
            <Anchor component={Link} to="/staff" c="depth" fw={700}>
              Орг
            </Anchor>
          </Text>
        </ScoreSurface>
      )}

      <EditTournamentModal
        tournament={tournament}
        opened={editOpened}
        onClose={() => setEditOpened(false)}
      />
    </TournamentShell>
  )
}
