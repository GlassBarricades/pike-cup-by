import { useEffect, useState } from 'react'
import { Button, Stack, Text, Textarea, Title } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lockTournamentRules, updateTournamentRules } from '../../features/tournament/api'
import { tournamentKeys } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'

export function StaffRulesPage() {
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

  return (
    <Stack gap="md" maw={720} mx="auto">
      <Title order={2}>Регламент турнира</Title>
      <Text size="sm" c="dimmed">
        Снимок для текущего турнира. После фиксации публичная страница только читает эту версию.
      </Text>
      <Textarea
        minRows={18}
        autosize
        value={content}
        onChange={(e) => setContent(e.currentTarget.value)}
        disabled={locked || !tournament}
      />
      <Button
        color="depth"
        disabled={locked || !tournament}
        loading={saveMutation.isPending}
        onClick={() => saveMutation.mutate()}
      >
        Сохранить
      </Button>
      <Button
        variant="light"
        color="orange"
        disabled={locked || !tournament}
        loading={lockMutation.isPending}
        onClick={() => lockMutation.mutate()}
      >
        Зафиксировать регламент
      </Button>
      {locked && <Text size="sm" c="dimmed">Регламент зафиксирован</Text>}
    </Stack>
  )
}
