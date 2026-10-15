import { useMemo, useState } from 'react'
import { Badge, Button, Group, MultiSelect, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEntryZones } from '../../features/tournament/api'
import { tournamentKeys, useEntries } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { oppositeZone } from '../../features/tournament/schedule'
import { ScoreSurface } from '../../components/ui'
import { entryTeamName, type TournamentEntry, type ZoneCode } from '../../features/tournament/types'

function ZoneColumn({
  title,
  color,
  entries,
}: {
  title: string
  color: 'depth' | 'reed' | 'gray'
  entries: TournamentEntry[]
}) {
  const accent = color === 'depth' || color === 'reed' ? color : null
  return (
    <ScoreSurface
      p="sm"
      accent={accent}
      style={{
        flex: 1,
        minWidth: 0,
      }}
    >
      <Group justify="space-between" gap="xs" mb="xs">
        <Text fw={800}>{title}</Text>
        <Badge color={color} variant="filled" className="pc-tabular">
          {entries.length}
        </Badge>
      </Group>
      {entries.length === 0 ? (
        <Text size="sm" c="dimmed">
          Пусто
        </Text>
      ) : (
        <Stack gap={4}>
          {entries.map((e) => (
            <Text key={e.id} size="sm" fw={600}>
              {entryTeamName(e)}
            </Text>
          ))}
        </Stack>
      )}
    </ScoreSurface>
  )
}

export function StaffDrawPage() {
  const { selected: tournament } = useStaffTournament()
  const { data: entries = [] } = useEntries(tournament?.id)
  const queryClient = useQueryClient()
  const [zone, setZone] = useState<ZoneCode>('A')
  const [entryIds, setEntryIds] = useState<string[]>([])

  const sorted = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => entryTeamName(a).localeCompare(entryTeamName(b), 'ru')),
    [entries],
  )

  const inA = sorted.filter((e) => e.start_zone === 'A')
  const inB = sorted.filter((e) => e.start_zone === 'B')
  const unassigned = sorted.filter((e) => !e.start_zone)

  const selectable = useMemo(
    () =>
      sorted
        .filter((e) => e.start_zone !== zone)
        .map((e) => ({
          value: e.id,
          label:
            e.start_zone == null
              ? entryTeamName(e)
              : `${entryTeamName(e)} (сейчас ${e.start_zone})`,
        })),
    [sorted, zone],
  )

  const otherZone = oppositeZone(zone)!
  const remainingIds = unassigned.map((e) => e.id)
  const canFillOther =
    remainingIds.length > 0 && (zone === 'A' ? inA.length > 0 : inB.length > 0)

  const assignMutation = useMutation({
    mutationFn: ({ ids, target }: { ids: string[]; target: ZoneCode }) =>
      updateEntryZones(ids, target),
    onSuccess: async () => {
      setEntryIds([])
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament.id) })
      }
    },
  })

  return (
    <Stack gap="lg" maw={720} mx="auto">
      <div>
        <Title order={2}>Стартовые зоны</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Выберите зону старта (I тур) и добавьте в неё команды. II тур — автоматически{' '}
          {otherZone}. После назначения одной зоны можно отправить всех оставшихся в другую.
        </Text>
      </div>

      <SegmentedControl
        value={zone}
        onChange={(v) => {
          setZone(v as ZoneCode)
          setEntryIds([])
        }}
        data={[
          { value: 'A', label: `Зона A · I тур` },
          { value: 'B', label: `Зона B · I тур` },
        ]}
        color={zone === 'A' ? 'depth' : 'reed'}
        fullWidth
      />

      <MultiSelect
        label={`Команды → зона ${zone}`}
        description={`II тур для этих команд будет зона ${otherZone}`}
        data={selectable}
        value={entryIds}
        onChange={setEntryIds}
        searchable
        clearable
        placeholder="Найти и выбрать команды"
        nothingFoundMessage="Нет команд для назначения"
        disabled={!tournament || selectable.length === 0}
      />

      <Group grow preventGrowOverflow={false} wrap="wrap">
        <Button
          color={zone === 'A' ? 'depth' : 'reed'}
          disabled={!tournament || entryIds.length === 0}
          loading={assignMutation.isPending}
          onClick={() => assignMutation.mutate({ ids: entryIds, target: zone })}
        >
          Назначить в зону {zone}
          {entryIds.length > 0 ? ` (${entryIds.length})` : ''}
        </Button>
        <Button
          variant="outline"
          color={otherZone === 'A' ? 'depth' : 'reed'}
          disabled={!tournament || !canFillOther}
          loading={assignMutation.isPending}
          onClick={() => assignMutation.mutate({ ids: remainingIds, target: otherZone })}
        >
          Оставшихся в зону {otherZone}
          {canFillOther ? ` (${remainingIds.length})` : ''}
        </Button>
      </Group>

      {assignMutation.isError && (
        <Text c="red" size="sm">
          {(assignMutation.error as Error).message}
        </Text>
      )}

      <Group gap="sm" align="stretch" grow preventGrowOverflow={false} wrap="wrap">
        <ZoneColumn title="Зона A (I тур)" color="depth" entries={inA} />
        <ZoneColumn title="Зона B (I тур)" color="reed" entries={inB} />
        <ZoneColumn title="Без зоны" color="gray" entries={unassigned} />
      </Group>
    </Stack>
  )
}
