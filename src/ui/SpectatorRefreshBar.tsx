import { Button, Group, Text } from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import { useRefreshTournament } from '../features/tournament/hooks'

function formatUpdatedAt(value: Date | null) {
  if (!value) return 'ещё не обновляли'
  return value.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Плавающая панель обновления для зрителей: всегда под рукой, над нижней навигацией. */
export function SpectatorRefreshBar({ tournamentId }: { tournamentId: string | undefined }) {
  const { refresh, isFetching, updatedAt } = useRefreshTournament(tournamentId)

  if (!tournamentId) return null

  return (
    <div className="pc-refresh-dock" role="region" aria-label="Обновление результатов">
      <Group gap="sm" wrap="nowrap" align="center" className="pc-refresh-dock__inner">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text size="xs" c="dimmed" lh={1.2}>
            Данные не обновляются сами
          </Text>
          <Text size="sm" fw={600} className="pc-tabular" lh={1.2} mt={2}>
            {isFetching ? 'Обновляем…' : `Обновлено ${formatUpdatedAt(updatedAt)}`}
          </Text>
        </div>
        <Button
          color="signal"
          size="sm"
          loading={isFetching}
          leftSection={<IconRefresh size={16} />}
          onClick={() => void refresh()}
          style={{ flexShrink: 0 }}
        >
          Обновить
        </Button>
      </Group>
    </div>
  )
}
