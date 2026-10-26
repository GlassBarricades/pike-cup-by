import { useEffect, useState } from 'react'
import { Button, Stack, Text, Textarea } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lockTournamentRules, updateTournamentRules } from '../../features/tournament/api'
import { tournamentKeys } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import { EmptyState, PageHero, Panel } from '../../ui'

export function RulesEditScreen({ embedded = false }: { embedded?: boolean }) {
  const { selected: tournament } = useStaffTournament()
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (tournament) setContent(tournament.rules_content)
  }, [tournament])

  const saveMutation = useMutation({
    mutationFn: () => updateTournamentRules(tournament!.id, content),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournament.id) })
      }
    },
  })

  const lockMutation = useMutation({
    mutationFn: () => lockTournamentRules(tournament!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournament.id) })
      }
    },
  })

  const closed = useTournamentDayClosed()
  const fixed = Boolean(tournament?.rules_locked_at)
  const locked = fixed || closed

  if (!tournament) {
    return (
      <EmptyState
        title="Нет турнира"
        description="Выберите турнир сверху, чтобы редактировать регламент."
      />
    )
  }

  return (
    <Stack gap="md">
      {!embedded && (
        <PageHero
          title="Регламент турнира"
          subtitle="Снимок для текущего турнира. После фиксации публичная страница только читает эту версию."
        />
      )}
      <Panel>
        <Stack gap="md">
          {embedded && (
            <Text size="sm" c="dimmed">
              Снимок для этого турнира. После фиксации публичная страница только читает эту версию.
            </Text>
          )}
          <Textarea
            minRows={18}
            autosize
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            disabled={locked}
          />
          <Button
            color="signal"
            disabled={locked}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Сохранить
          </Button>
          <Button
            variant="light"
            color="orange"
            disabled={locked}
            loading={lockMutation.isPending}
            onClick={() => lockMutation.mutate()}
          >
            Зафиксировать регламент
          </Button>
          {locked && (
            <Text size="sm" c="dimmed">
              {closed
                ? 'Турнир завершён. Регламент откроется после перезапуска.'
                : 'Регламент зафиксирован'}
            </Text>
          )}
        </Stack>
      </Panel>
    </Stack>
  )
}
