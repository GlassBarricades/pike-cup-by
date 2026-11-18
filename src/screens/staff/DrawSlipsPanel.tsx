import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  countAssignedDrawSlips,
  seedDrawSlipsForTournament,
} from '../../features/tournament/api'
import { getFormat } from '../../features/tournament/formats'
import { tournamentKeys, useDrawSlips, useEntries } from '../../features/tournament/hooks'
import { slipPackIdForFormat, slipPackLabel } from '../../features/tournament/slipPacks'
import {
  formatSlipCode,
  slipFirstTourSector,
  slipSector,
} from '../../features/tournament/slips'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import {
  entryTeamName,
  type DrawSlip,
  type Tournament,
  type ZoneCode,
} from '../../features/tournament/types'
import { ClosedDayNotice, Panel, SectionTitle, SlipGrid } from '../../ui'

function sectorLine(slip: DrawSlip, tour: number, minis: number) {
  return Array.from({ length: minis }, (_, i) => slipSector(slip, tour, i + 1) ?? '—').join(' ')
}

export function DrawSlipsPanel({ tournament }: { tournament: Tournament }) {
  const closed = useTournamentDayClosed()
  const queryClient = useQueryClient()
  const format = getFormat(tournament)
  const packId = slipPackIdForFormat(format)
  const { data: slips = [], refetch: refetchSlips } = useDrawSlips(tournament.id)
  const { data: entries = [] } = useEntries(tournament.id)
  const [zone, setZone] = useState<'all' | ZoneCode>('all')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const assignedQuery = useQuery({
    queryKey: [...tournamentKeys.drawSlips(tournament.id), 'assigned'],
    queryFn: () => countAssignedDrawSlips(tournament.id),
  })
  const assigned = assignedQuery.data ?? 0
  const slipCount = slips.length
  const tourMinis = format.tours.map((t) => t.minis)

  const ownerBySlip = useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of entries) {
      if (entry.draw_slip_id) {
        map.set(entry.draw_slip_id, entryTeamName(entry))
      }
      for (const member of entry.roster ?? []) {
        if (member.draw_slip_id) {
          map.set(member.draw_slip_id, member.full_name_snapshot)
        }
      }
    }
    return map
  }, [entries])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    return slips.filter((slip) => {
      if (zone !== 'all' && slip.start_zone !== zone) return false
      if (!query) return true
      const owner = ownerBySlip.get(slip.id)?.toLowerCase() ?? ''
      const first = slipFirstTourSector(slip)
      const firstLabel = first != null ? String(first) : ''
      return (
        slip.code.toLowerCase().includes(query) ||
        owner.includes(query) ||
        firstLabel === query ||
        `сектор ${firstLabel}`.includes(query)
      )
    })
  }, [slips, zone, search, ownerBySlip])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: tournamentKeys.drawSlips(tournament.id) })
    await refetchSlips()
    await assignedQuery.refetch()
  }

  const seedMutation = useMutation({
    mutationFn: (replace: boolean) => seedDrawSlipsForTournament(tournament.id, format, { replace }),
    onSuccess: invalidate,
  })

  if (!packId) {
    return (
      <Panel>
        <Text size="sm" c="dimmed">
          Для этого формата бумажки не используются (жеребьёвка без карточек).
        </Text>
      </Panel>
    )
  }

  return (
    <Stack gap="md">
      {closed && <ClosedDayNotice />}
      <Panel>
        <Stack gap="md">
          <SectionTitle>Пакет бумажек турнира</SectionTitle>
          <Text size="sm">
            Пакет: <Text span fw={700}>{slipPackLabel(packId)}</Text>
          </Text>
          <Text size="sm" c="dimmed">
            Бумажки принадлежат только этому турниру — в PikeCup и Кордоне колоды не смешиваются.
          </Text>
          <Text size="sm" className="pc-tabular">
            В турнире: {slipCount} · выдано: {assigned}
          </Text>
          {slipCount === 0 ? (
            <Button
              color="signal"
              disabled={closed}
              loading={seedMutation.isPending}
              onClick={() => seedMutation.mutate(false)}
            >
              Создать пакет
            </Button>
          ) : (
            <Button
              variant="outline"
              color="orange"
              disabled={closed || assigned > 0}
              loading={seedMutation.isPending}
              onClick={() => {
                if (
                  !window.confirm(
                    'Удалить текущие бумажки турнира и залить пакет заново по формату?',
                  )
                ) {
                  return
                }
                seedMutation.mutate(true)
              }}
            >
              Перезалить по формату
            </Button>
          )}
          {assigned > 0 && slipCount > 0 && (
            <Text size="xs" c="dimmed">
              Перезалив недоступен, пока есть назначения. Сначала снимите бумажки в жеребьёвке.
            </Text>
          )}
          {seedMutation.isError && (
            <Text c="red" size="sm">
              {(seedMutation.error as Error).message}
            </Text>
          )}
          {seedMutation.isSuccess && seedMutation.data && (
            <Text c="teal" size="sm">
              {seedMutation.data.seeded > 0
                ? `Залито бумажек: ${seedMutation.data.seeded}`
                : 'Пакет уже был на месте'}
            </Text>
          )}
        </Stack>
      </Panel>

      {slipCount > 0 && (
        <div>
          <SectionTitle>Залитые бумажки ({slipCount})</SectionTitle>
          <Panel>
            <Stack gap="md">
              <TextInput
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                placeholder="Номер, сектор I тура или владелец"
                leftSection={<IconSearch size={16} />}
              />
              <SegmentedControl
                value={zone}
                onChange={(value) => setZone(value as 'all' | ZoneCode)}
                data={[
                  { value: 'all', label: `Все ${slips.length}` },
                  { value: 'A', label: `Старт A` },
                  { value: 'B', label: `Старт B` },
                ]}
                fullWidth
              />
              <Text size="xs" c="dimmed">
                {visible.length === slips.length && zone === 'all' && !search.trim()
                  ? 'Нажмите строку, чтобы увидеть секторы по турам.'
                  : `Найдено ${visible.length}`}
              </Text>
              {visible.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Ничего не найдено
                </Text>
              ) : (
                <Stack gap="xs">
                  {visible.map((slip) => {
                    const open = openId === slip.id
                    const owner = ownerBySlip.get(slip.id)
                    const minisT1 = tourMinis[0] ?? 5
                    const minisT2 = tourMinis[1] ?? minisT1
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
                          onClick={() => setOpenId(open ? null : slip.id)}
                          w="100%"
                        >
                          <Group justify="space-between" gap="xs" wrap="nowrap">
                            <div style={{ minWidth: 0 }}>
                              <Text fw={800}>{formatSlipCode(slip.code)}</Text>
                              <Text size="xs" c="dimmed" className="pc-tabular">
                                I {sectorLine(slip, 1, minisT1)} · II {sectorLine(slip, 2, minisT2)}
                              </Text>
                            </div>
                            <Text size="xs" c="dimmed" style={{ flex: 1 }} truncate>
                              {owner ?? 'Свободна'}
                            </Text>
                            <Badge
                              color={slip.start_zone === 'A' ? 'zoneA' : 'zoneB'}
                              variant="filled"
                            >
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
        </div>
      )}
    </Stack>
  )
}
