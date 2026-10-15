import { Alert, Stack, Text } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { TournamentShell } from '../../components/TournamentShell'
import { ScoreSurface, SectionHead } from '../../components/ui'
import { useTournament } from '../../features/tournament/hooks'

export function RulesPage() {
  const { tournamentId } = useParams()
  const { data: tournament, isLoading, error } = useTournament(tournamentId)

  if (isLoading) {
    return <Text c="dimmed">Загрузка…</Text>
  }

  if (!tournament) {
    return <Alert color="red">Турнир не найден</Alert>
  }

  return (
    <TournamentShell tournament={tournament}>
      <SectionHead
        title="Регламент"
        description={
          tournament.rules_locked_at
            ? 'Зафиксирован для турнира'
            : 'Черновик — организатор ещё может внести правки'
        }
        order={3}
      />
      {error && <Alert color="red">Не удалось загрузить регламент</Alert>}
      <ScoreSurface p="md">
        <RulesBody content={tournament.rules_content} />
      </ScoreSurface>
    </TournamentShell>
  )
}

function RulesBody({ content }: { content: string }) {
  const blocks = content.split('\n').filter((line) => line.trim().length > 0)

  return (
    <Stack gap="xs">
      {blocks.map((line, index) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('# ')) {
          return (
            <Text key={index} fw={800} size="lg" mt={index === 0 ? 0 : 'sm'}>
              {trimmed.slice(2)}
            </Text>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={index} fw={700} mt="xs">
              {trimmed.slice(3)}
            </Text>
          )
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <Text key={index} size="sm" pl="md">
              · {trimmed.slice(2)}
            </Text>
          )
        }
        return (
          <Text key={index} size="sm">
            {trimmed}
          </Text>
        )
      })}
      {blocks.length === 0 && (
        <Text c="dimmed" size="sm">
          Регламент пока не заполнен
        </Text>
      )}
    </Stack>
  )
}
