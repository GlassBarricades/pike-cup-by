import { useMemo, useState } from 'react'
import { Badge, Button, Group, Select, Stack, Text } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeZoneJudge, setZoneJudge } from '../../features/tournament/api'
import {
  tournamentKeys,
  useJudgeCandidates,
  useZoneJudges,
} from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import type { ZoneCode, ZoneJudgeRow } from '../../features/tournament/types'
import { ClosedDayNotice, EmptyState, PageHero, Panel } from '../../ui'

function ZoneJudgeColumn({
  zone,
  title,
  color,
  judges,
  candidates,
  assignedIds,
  tournamentId,
  onAssigned,
  closed,
}: {
  zone: ZoneCode
  title: string
  color: 'zoneA' | 'zoneB'
  judges: ZoneJudgeRow[]
  candidates: { value: string; label: string }[]
  assignedIds: Set<string>
  tournamentId: string
  onAssigned: () => void
  closed: boolean
}) {
  const [userId, setUserId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const available = useMemo(
    () => candidates.filter((c) => !assignedIds.has(c.value)),
    [candidates, assignedIds],
  )

  const assignMutation = useMutation({
    mutationFn: () => setZoneJudge({ tournamentId, userId: userId!, zone }),
    onSuccess: async () => {
      setUserId(null)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.zoneJudges(tournamentId) })
      onAssigned()
    },
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeZoneJudge(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.zoneJudges(tournamentId) })
    },
  })

  return (
    <Panel
      p="sm"
      style={{
        flex: 1,
        minWidth: 0,
        borderLeft: `3px solid ${color === 'zoneA' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'}`,
      }}
    >
      <Group justify="space-between" gap="xs" mb="sm">
        <Text fw={800}>{title}</Text>
        <Badge color={color} variant="filled" className="pc-tabular">
          {judges.length}
        </Badge>
      </Group>

      {judges.length === 0 ? (
        <Text size="sm" c="dimmed" mb="sm">
          Судьи не назначены
        </Text>
      ) : (
        <Stack gap="xs" mb="sm">
          {judges.map((j) => (
            <Group key={j.id} justify="space-between" wrap="nowrap" gap="xs">
              <Text size="sm" fw={600} lineClamp={1}>
                {j.profile?.full_name ?? j.user_id.slice(0, 8)}
              </Text>
              <Button
                size="compact-xs"
                variant="subtle"
                color="red"
                disabled={closed}
                loading={removeMutation.isPending && removeMutation.variables === j.id}
                onClick={() => {
                  const name = j.profile?.full_name ?? 'судью'
                  if (!window.confirm(`Снять ${name} с зоны ${zone}?`)) return
                  removeMutation.mutate(j.id)
                }}
                leftSection={<IconTrash size={14} />}
              >
                Снять
              </Button>
            </Group>
          ))}
        </Stack>
      )}

      <Select
        placeholder="Выбрать судью"
        data={available}
        value={userId}
        onChange={setUserId}
        searchable
        clearable
        disabled={closed}
        nothingFoundMessage="Нет свободных судей"
        mb="xs"
      />
      <Button
        color={color}
        fullWidth
        disabled={closed || !userId || !tournamentId}
        loading={assignMutation.isPending}
        onClick={() => assignMutation.mutate()}
      >
        Назначить на {zone}
      </Button>
      {assignMutation.isError && (
        <Text c="red" size="xs" mt="xs">
          {(assignMutation.error as Error).message}
        </Text>
      )}
    </Panel>
  )
}

export function JudgesScreen({ embedded = false }: { embedded?: boolean }) {
  const { selected: tournament } = useStaffTournament()
  const closed = useTournamentDayClosed()
  const { data: judges = [] } = useZoneJudges(tournament?.id)
  const { data: candidates = [] } = useJudgeCandidates()

  const candidateOptions = useMemo(
    () =>
      candidates.map((c) => ({
        value: c.id,
        label: c.full_name?.trim() || c.id.slice(0, 8),
      })),
    [candidates],
  )

  const assignedIds = useMemo(() => new Set(judges.map((j) => j.user_id)), [judges])
  const inA = judges.filter((j) => j.zone === 'A')
  const inB = judges.filter((j) => j.zone === 'B')

  if (!tournament) {
    return (
      <EmptyState
        title="Судьи зон"
        description="Сначала выберите турнир сверху."
      />
    )
  }

  return (
    <Stack gap="lg" w="100%">
      {!embedded && (
        <PageHero
          title="Судьи зон"
          subtitle="Назначьте пользователей с ролью «Судья» на физические зоны A и B. Несколько судей на одну зону допустимы. Один судья — только одна зона в турнире."
        />
      )}
      {embedded && (
        <Text size="sm" c="dimmed">
          Несколько судей на одну зону можно. Один судья занимает только одну зону в этом турнире.
        </Text>
      )}

      {closed && <ClosedDayNotice />}

      {candidates.length === 0 && (
        <Text size="sm" c="orange">
          Нет пользователей с ролью judge. Назначьте роль в разделе админа.
        </Text>
      )}

      <Group align="stretch" grow preventGrowOverflow={false} wrap="wrap">
        <ZoneJudgeColumn
          zone="A"
          title="Зона A"
          color="zoneA"
          judges={inA}
          candidates={candidateOptions}
          assignedIds={assignedIds}
          tournamentId={tournament.id}
          onAssigned={() => undefined}
          closed={closed}
        />
        <ZoneJudgeColumn
          zone="B"
          title="Зона B"
          color="zoneB"
          judges={inB}
          candidates={candidateOptions}
          assignedIds={assignedIds}
          tournamentId={tournament.id}
          onAssigned={() => undefined}
          closed={closed}
        />
      </Group>
    </Stack>
  )
}
