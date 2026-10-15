import { useEffect, useState } from 'react'
import { Button, Stack, Text, Textarea } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lockTournamentRules, updateTournamentRules } from '../../features/tournament/api'
import { tournamentKeys } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { EmptyState, PageHero, Panel } from '../../ui'

export function RulesEditScreen() {
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

  const locked = Boolean(tournament?.rules_locked_at)

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
      <PageHero
        title="Регламент турнира"
        subtitle="Снимок для текущего турнира. После фиксации публичная страница только читает эту версию."
      />
      <Panel>
        <Stack gap="md">
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
              Регламент зафиксирован
            </Text>
          )}
        </Stack>
      </Panel>
    </Stack>
  )
}
