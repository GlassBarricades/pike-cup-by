import { Badge, Group, Stack, Text } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { TournamentShell } from '../../components/TournamentShell'
import { ScoreSurface, SectionHead } from '../../components/ui'
import { useEntries, useTournament } from '../../features/tournament/hooks'
import { entryTeamName } from '../../features/tournament/types'
import { oppositeZone } from '../../features/tournament/schedule'

export function TeamsPage() {
  const { tournamentId } = useParams()
  const { data: tournament } = useTournament(tournamentId)
  const { data: entries = [], isLoading } = useEntries(tournament?.id)

  const visible = entries.filter((e) => e.status !== 'withdrawn')

  if (!tournament) {
    return <Text c="dimmed">Загрузка…</Text>
  }

  return (
    <TournamentShell tournament={tournament}>
      <SectionHead
        title="Команды"
        description="Состав на момент участия (снимок). Смена текущего состава команду историю не меняет."
        order={3}
      />
      {isLoading && <Text c="dimmed">Загрузка…</Text>}
      {!isLoading && visible.length === 0 && (
        <Text c="dimmed">Пока нет заявок. Организатор добавит команды в кабинете.</Text>
      )}
      <Stack gap={0}>
        {visible.map((entry, i) => {
          const roster = (entry.roster ?? []).slice().sort((a, b) => a.slot - b.slot)
          const zone2 = oppositeZone(entry.start_zone)
          const accent =
            entry.start_zone === 'A' ? 'depth' : entry.start_zone === 'B' ? 'reed' : undefined
          return (
            <ScoreSurface
              key={entry.id}
              accent={accent}
              p="sm"
              style={{
                borderRadius: 0,
                borderBottom:
                  i < visible.length - 1
                    ? '1px solid var(--pc-hairline)'
                    : undefined,
              }}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <div style={{ minWidth: 0 }}>
                  <Text fw={800} lineClamp={1}>
                    {entryTeamName(entry)}
                  </Text>
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {roster.map((r) => r.full_name_snapshot).join(' · ') || 'Состав не указан'}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2} className="pc-tabular">
                    I тур: зона {entry.start_zone ?? '—'}
                    {zone2 ? ` · II тур: зона ${zone2}` : ''}
                  </Text>
                </div>
                <Badge
                  variant="filled"
                  color={entry.start_zone === 'B' ? 'reed' : 'depth'}
                  style={{ flexShrink: 0 }}
                >
                  {entry.quota}
                </Badge>
              </Group>
            </ScoreSurface>
          )
        })}
      </Stack>
    </TournamentShell>
  )
}
