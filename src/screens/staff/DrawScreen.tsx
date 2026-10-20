import { useMemo, useState } from 'react'
import {
  Badge,
  Group,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setEntryDrawSlip } from '../../features/tournament/api'
import { tournamentKeys, useDrawSlips, useEntries } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { formatSlipCode, slipOptionLabel, slipSector } from '../../features/tournament/slips'
import {
  entryTeamName,
  type DrawSlip,
  type TournamentEntry,
  type ZoneCode,
} from '../../features/tournament/types'
import { EmptyState, PageHero, Panel, SectionTitle, SlipGrid } from '../../ui'

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
          {entries.map((entry) => (
            <Text key={entry.id} size="sm" fw={600}>
              {entryTeamName(entry)}
              {entry.draw_slip ? ` · ${formatSlipCode(entry.draw_slip.code)}` : ''}
            </Text>
          ))}
        </Stack>
      )}
    </Panel>
  )
}

function sectorLine(slip: DrawSlip, tour: 1 | 2) {
  return [1, 2, 3, 4, 5].map((mini) => slipSector(slip, tour, mini) ?? '—').join(' ')
}

type AssignFilter = 'all' | 'free' | ZoneCode

function SlipCatalog({
  slips,
  entries,
}: {
  slips: DrawSlip[]
  entries: TournamentEntry[]
}) {
  const [zone, setZone] = useState<'all' | ZoneCode>('all')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const ownerBySlip = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of entries) {
      if (entry.draw_slip_id) map.set(entry.draw_slip_id, entryTeamName(entry))
    }
    return map
  }, [entries])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return slips.filter((slip) => {
      if (zone !== 'all' && slip.start_zone !== zone) return false
      if (!query) return true
      const owner = ownerBySlip.get(slip.id)?.toLowerCase() ?? ''
      return slip.code.toLowerCase().includes(query) || owner.includes(query)
    })
  }, [slips, zone, search, ownerBySlip])

  const query = search.trim()
  const expandAll = query.length > 0 && visible.length > 0 && visible.length <= 2

  return (
    <Stack gap="sm">
      <SectionTitle>Справочник бумажек</SectionTitle>
      {slips.length === 0 ? (
        <EmptyState
          title="Справочник пуст"
          description="Карточки жеребьёвки ещё не загружены в справочник."
        />
      ) : (
        <Panel>
          <Stack gap="md">
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Номер бумажки или команда"
              leftSection={<IconSearch size={16} />}
            />
            <SegmentedControl
              value={zone}
              onChange={(value) => setZone(value as 'all' | ZoneCode)}
              data={[
                { value: 'all', label: `Все ${slips.length}` },
                { value: 'A', label: 'Старт A' },
                { value: 'B', label: 'Старт B' },
              ]}
              fullWidth
            />
            <Text size="xs" c="dimmed">
              {visible.length === slips.length && zone === 'all' && !query
                ? `${slips.length} бумажек. Нажмите строку, чтобы увидеть секторы.`
                : `Найдено ${visible.length}`}
            </Text>
            {visible.length === 0 ? (
              <Text size="sm" c="dimmed">
                Ничего не найдено
              </Text>
            ) : (
              <Stack gap="xs">
                {visible.map((slip) => {
                  const open = expandAll || openId === slip.id
                  const owner = ownerBySlip.get(slip.id)
                  return (
                    <Panel
                      key={slip.id}
                      p="sm"
                      style={{
                        borderLeft: `3px solid ${
                          slip.start_zone === 'A' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'
                        }`,
                      }}
                    >
                      <UnstyledButton
                        onClick={() => setOpenId(open && !expandAll ? null : slip.id)}
                        w="100%"
                      >
                        <Group justify="space-between" gap="xs" wrap="nowrap">
                          <Text fw={800}>{formatSlipCode(slip.code)}</Text>
                          <Text size="xs" c="dimmed" style={{ flex: 1 }} truncate>
                            {owner ?? 'Свободна'}
                          </Text>
                          <Badge color={slip.start_zone === 'A' ? 'zoneA' : 'zoneB'} variant="filled">
                            {slip.start_zone}
                          </Badge>
                        </Group>
                      </UnstyledButton>
                      {open && (
                        <div style={{ marginTop: 8 }}>
                          <SlipGrid slip={slip} />
                        </div>
                      )}
                    </Panel>
                  )
                })}
              </Stack>
            )}
          </Stack>
        </Panel>
      )}
    </Stack>
  )
}

export function DrawScreen() {
  const { selected: tournament } = useStaffTournament()
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: slips = [] } = useDrawSlips()
  const queryClient = useQueryClient()
  const [teamSearch, setTeamSearch] = useState('')
  const [assignFilter, setAssignFilter] = useState<AssignFilter>('all')
  const [openEntryId, setOpenEntryId] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => entryTeamName(a).localeCompare(entryTeamName(b), 'ru')),
    [entries],
  )

  const inA = sorted.filter((entry) => entry.start_zone === 'A')
  const inB = sorted.filter((entry) => entry.start_zone === 'B')
  const unassigned = sorted.filter((entry) => !entry.start_zone)

  const slipMutation = useMutation({
    mutationFn: ({ entryId, slipId }: { entryId: string; slipId: string | null }) =>
      setEntryDrawSlip(entryId, slipId),
    onSuccess: async () => {
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament.id) })
      }
    },
  })

  const takenSlipIds = useMemo(
    () => new Set(entries.map((entry) => entry.draw_slip_id).filter((id): id is string => Boolean(id))),
    [entries],
  )

  const teamQuery = teamSearch.trim().toLowerCase()
  const visibleEntries = sorted.filter((entry) => {
    if (assignFilter === 'free' && entry.draw_slip_id) return false
    if (assignFilter === 'A' && entry.start_zone !== 'A') return false
    if (assignFilter === 'B' && entry.start_zone !== 'B') return false
    if (!teamQuery) return true
    const code = entry.draw_slip?.code.toLowerCase() ?? ''
    return entryTeamName(entry).toLowerCase().includes(teamQuery) || code.includes(teamQuery)
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
        title="Жеребьёвка"
        subtitle="Прикрепите бумажку к команде. Стартовая зона I тура записывается с карточки, II тур — противоположная зона."
      />

      <Panel>
        <Stack gap="md">
          <SectionTitle>Прикрепить бумажку</SectionTitle>
          {sorted.length === 0 ? (
            <Text size="sm" c="dimmed">
              Сначала добавьте заявки
            </Text>
          ) : (
            <>
              <TextInput
                value={teamSearch}
                onChange={(event) => setTeamSearch(event.currentTarget.value)}
                placeholder="Команда или номер бумажки"
                leftSection={<IconSearch size={16} />}
              />
              <SegmentedControl
                value={assignFilter}
                onChange={(value) => setAssignFilter(value as AssignFilter)}
                data={[
                  { value: 'all', label: `Все ${sorted.length}` },
                  { value: 'free', label: `Без ${unassigned.length}` },
                  { value: 'A', label: `A ${inA.length}` },
                  { value: 'B', label: `B ${inB.length}` },
                ]}
                fullWidth
              />
              {visibleEntries.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Ничего не найдено
                </Text>
              ) : (
                <Stack gap="sm">
                  {teamQuery || assignFilter !== 'all' ? (
                    <Text size="xs" c="dimmed">
                      Показано {visibleEntries.length} из {sorted.length}
                    </Text>
                  ) : null}
                  {visibleEntries.map((entry) => {
                    const options = slips
                      .filter((slip) => slip.id === entry.draw_slip_id || !takenSlipIds.has(slip.id))
                      .map((slip) => ({ value: slip.id, label: slipOptionLabel(slip) }))
                    const open = openEntryId === entry.id
                    return (
                      <Stack key={entry.id} gap={6}>
                        <Group gap="sm" align="flex-end" wrap="wrap">
                          <Text fw={700} style={{ flex: '1 1 10rem' }}>
                            {entryTeamName(entry)}
                          </Text>
                          <Select
                            data={options}
                            value={entry.draw_slip_id}
                            onChange={(slipId) => {
                              slipMutation.mutate({ entryId: entry.id, slipId })
                              if (slipId) setOpenEntryId(entry.id)
                            }}
                            searchable
                            clearable
                            placeholder={slips.length === 0 ? 'В справочнике нет бумажек' : 'Бумажка'}
                            nothingFoundMessage="Нет свободных бумажек"
                            disabled={slips.length === 0 || slipMutation.isPending}
                            style={{ flex: '1 1 14rem' }}
                          />
                        </Group>
                        {entry.draw_slip && (
                          <UnstyledButton onClick={() => setOpenEntryId(open ? null : entry.id)}>
                            <Text size="xs" c="dimmed" className="pc-tabular">
                              I {sectorLine(entry.draw_slip, 1)} · II {sectorLine(entry.draw_slip, 2)}
                            </Text>
                          </UnstyledButton>
                        )}
                        {entry.draw_slip && open && <SlipGrid slip={entry.draw_slip} />}
                      </Stack>
                    )
                  })}
                </Stack>
              )}
            </>
          )}
          {slipMutation.isError && (
            <Text c="red" size="sm">
              {(slipMutation.error as Error).message}
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

      <SlipCatalog slips={slips} entries={entries} />
    </Stack>
  )
}
