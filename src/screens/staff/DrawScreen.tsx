import { useMemo, useState } from 'react'
import { Badge, Button, Group, MultiSelect, SegmentedControl, Stack, Text } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateEntryZones } from '../../features/tournament/api'
import { tournamentKeys, useEntries } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { oppositeZone } from '../../features/tournament/schedule'
import { entryTeamName, type TournamentEntry, type ZoneCode } from '../../features/tournament/types'
import { EmptyState, PageHero, Panel, SectionTitle } from '../../ui'

function ZoneColumn({
  title,
  color,
  entries,
}: {
  title: string
  color: 'zoneA' | 'zoneB' | 'gray'
  entries: TournamentEntry[]
}) {
  return (
    <Panel
      p="sm"
      style={{
        flex: 1,
        minWidth: 0,
        borderLeft:
          color === 'gray'
            ? undefined
            : `3px solid ${color === 'zoneA' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'}`,
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
    </Panel>
  )
}

export function DrawScreen() {
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

  if (!tournament) {
    return (
      <EmptyState
        title="Нет турнира"
        description="Выберите турнир сверху, чтобы назначить стартовые зоны."
      />
    )
  }

  return (
    <Stack gap="lg">
      <PageHero
        title="Стартовые зоны"
        subtitle={`Выберите зону старта (I тур) и добавьте в неё команды. II тур — автоматически ${otherZone}. После назначения одной зоны можно отправить всех оставшихся в другую.`}
      />

      <Panel>
        <Stack gap="md">
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
            color={zone === 'A' ? 'zoneA' : 'zoneB'}
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
            disabled={selectable.length === 0}
          />

          <Group grow preventGrowOverflow={false} wrap="wrap">
            <Button
              color={zone === 'A' ? 'zoneA' : 'zoneB'}
              disabled={entryIds.length === 0}
              loading={assignMutation.isPending}
              onClick={() => assignMutation.mutate({ ids: entryIds, target: zone })}
            >
              Назначить в зону {zone}
              {entryIds.length > 0 ? ` (${entryIds.length})` : ''}
            </Button>
            <Button
              variant="outline"
              color={otherZone === 'A' ? 'zoneA' : 'zoneB'}
              disabled={!canFillOther}
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
        </Stack>
      </Panel>

      <div>
        <SectionTitle>Распределение</SectionTitle>
        <Group gap="sm" align="stretch" grow preventGrowOverflow={false} wrap="wrap">
          <ZoneColumn title="Зона A (I тур)" color="zoneA" entries={inA} />
          <ZoneColumn title="Зона B (I тур)" color="zoneB" entries={inB} />
          <ZoneColumn title="Без зоны" color="gray" entries={unassigned} />
        </Group>
      </div>
    </Stack>
  )
}
