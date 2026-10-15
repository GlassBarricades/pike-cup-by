import { Button, Stack, Text } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { updateTournamentMeta } from '../../features/tournament/api'
import { formatTournamentDate, statusLabel } from '../../features/tournament/date'
import { tournamentKeys } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { EmptyState, PageHero, Panel } from '../../ui'

export function FinishScreen() {
  const { selected: tournament } = useStaffTournament()
  const queryClient = useQueryClient()

  const finishMutation = useMutation({
    mutationFn: () => updateTournamentMeta(tournament!.id, { status: 'finished' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournament.id) })
      }
    },
  })

  if (!tournament) {
    return (
      <EmptyState
        title="Нет турнира"
        description="Выберите турнир сверху, чтобы завершить соревнование."
      />
    )
  }

  const isFinished = tournament.status === 'finished'

  return (
    <Stack gap="lg">
      <PageHero
        title="Финиш турнира"
        subtitle={`${tournament.name} · ${formatTournamentDate(tournament.event_date)}`}
      />

      <Panel>
        <Stack gap="md">
          <Text size="sm">
            Текущий статус:{' '}
            <Text span fw={700} className="pc-display">
              {statusLabel[tournament.status]}
            </Text>
          </Text>
          <Text size="sm" c="dimmed">
            После завершения турнир уходит в архив. Публичный протокол и таблица остаются доступны.
          </Text>

          {!isFinished ? (
            <Button
              color="signal"
              loading={finishMutation.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    `Завершить турнир «${tournament.name}»? Статус станет «Архив».`,
                  )
                ) {
                  return
                }
                finishMutation.mutate()
              }}
            >
              Завершить турнир
            </Button>
          ) : (
            <Text size="sm" c="dimmed">
              Турнир уже завершён.
            </Text>
          )}

          {finishMutation.isError && (
            <Text c="red" size="sm">
              {(finishMutation.error as Error).message}
            </Text>
          )}

          <Button
            component={Link}
            to={`/tournament/${tournament.id}/results`}
            variant="outline"
            color="signal"
          >
            Открыть результаты
          </Button>
        </Stack>
      </Panel>
    </Stack>
  )
}
