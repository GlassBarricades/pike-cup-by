import { useMemo, useState } from 'react'
import { Badge, Button, Group, Loader, NumberInput, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  clearAthleteDraws,
  generateAthleteDraws,
  setAthleteDrawSlip,
  upsertAthleteDraws,
} from '../../features/tournament/api'
import { getFormat } from '../../features/tournament/formats'
import {
  tournamentKeys,
  useAthleteDraws,
  useDrawSlips,
  useEntries,
} from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import { oppositeZone } from '../../features/tournament/schedule'
import { formatSlipCode, slipOptionLabel } from '../../features/tournament/slips'
import { entryTeamColumn } from '../../features/tournament/types'
import { ClosedDayNotice, EmptyState, PageHero, Panel, SectionTitle } from '../../ui'

export function AthleteDrawScreen() {
  const { selected: tournament } = useStaffTournament()
  const closed = useTournamentDayClosed()
  const format = tournament ? getFormat(tournament) : null
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: draws = [] } = useAthleteDraws(tournament?.id)
  const { data: slips = [] } = useDrawSlips(tournament?.id)
  const queryClient = useQueryClient()
  const [sectorsPerZone, setSectorsPerZone] = useState(40)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editZone, setEditZone] = useState('A')
  const [editSector, setEditSector] = useState<number | string>(1)

  const athletes = useMemo(
    () =>
      entries.flatMap((entry) => {
        const rosterAthletes = (entry.roster ?? []).filter((m) => m.role === 'athlete')
        return rosterAthletes.map((member) => ({
          member,
          entryId: entry.id,
          teamName: entryTeamColumn(entry),
          partners: rosterAthletes.filter((m) => m.id !== member.id),
        }))
      }),
    [entries],
  )

  const entryAthleteIds = useMemo(
    () =>
      entries.map((entry) =>
        (entry.roster ?? []).filter((m) => m.role === 'athlete').map((m) => m.id),
      ),
    [entries],
  )

  const slipById = useMemo(() => new Map(slips.map((s) => [s.id, s])), [slips])

  const drawMap = useMemo(() => {
    const map = new Map<string, (typeof draws)[number]>()
    for (const row of draws) {
      map.set(`${row.roster_member_id}:${row.tour_number}:${row.mini_number}`, row)
    }
    return map
  }, [draws])

  const takenSlipIds = useMemo(
    () =>
      new Set(
        athletes
          .map((a) => a.member.draw_slip_id)
          .filter((id): id is string => Boolean(id)),
      ),
    [athletes],
  )

  const slots = useMemo(() => {
    if (!format) return [] as { tour: number; mini: number }[]
    return format.tours.flatMap((tour) =>
      Array.from({ length: tour.minis }, (_, i) => ({ tour: tour.number, mini: i + 1 })),
    )
  }, [format])

  const invalidate = async () => {
    if (!tournament) return
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: tournamentKeys.athleteDraws(tournament.id) }),
      queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament.id) }),
      queryClient.invalidateQueries({ queryKey: tournamentKeys.drawSlips(tournament.id) }),
    ])
  }

  const randomMutation = useMutation({
    mutationFn: async () => {
      // Случайные сектора без привязки к печатным бумажкам
      for (const { member } of athletes) {
        if (member.draw_slip_id) {
          await setAthleteDrawSlip({
            tournamentId: tournament!.id,
            rosterMemberId: member.id,
            slipId: null,
          })
        }
      }
      const rows = generateAthleteDraws({
        format: format!,
        rosterMemberIds: athletes.map((a) => a.member.id),
        entryAthleteIds,
        sectorsPerZone,
      })
      await clearAthleteDraws(tournament!.id)
      await upsertAthleteDraws(tournament!.id, rows)
    },
    onSuccess: invalidate,
  })

  const slipMutation = useMutation({
    mutationFn: async ({
      rosterMemberId,
      slipId,
    }: {
      rosterMemberId: string
      slipId: string | null
    }) => {
      await setAthleteDrawSlip({
        tournamentId: tournament!.id,
        rosterMemberId,
        slipId,
      })
      await invalidate()
    },
  })

  const saveEditMutation = useMutation({
    mutationFn: async () => {
      if (!editKey || !tournament) return
      const [rosterMemberId, tour, mini] = editKey.split(':')
      await upsertAthleteDraws(tournament.id, [
        {
          roster_member_id: rosterMemberId!,
          tour_number: Number(tour),
          mini_number: Number(mini),
          zone: editZone,
          sector: Number(editSector) || 1,
        },
      ])
    },
    onSuccess: async () => {
      setEditKey(null)
      await invalidate()
    },
  })

  if (!tournament || !format) {
    return <EmptyState title="Нет турнира" description="Выберите турнир сверху." />
  }

  if (format.draw !== 'per_athlete_sectors') {
    return (
      <EmptyState
        title="Жеребьёвка по секторам не нужна"
        description="Для этого формата используется другой тип жеребьёвки (бумажки PikeCup)."
      />
    )
  }

  return (
    <Stack gap="lg">
      <PageHero
        title="Жеребьёвка спортсменов"
        subtitle="Выдайте бумажку Кордона спортсмену или разыграйте сектора случайно. Бумажки только этого турнира."
      />
      {closed && <ClosedDayNotice />}

      <Panel>
        <Stack gap="md">
          <SectionTitle>Бумажки турнира</SectionTitle>
          {slips.length === 0 ? (
            <Text size="sm" c="dimmed">
              Пакет пуст. Создайте его во вкладке «Турнир → Бумажки».
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              Доступно {slips.length} бумажек · занято {takenSlipIds.size}
            </Text>
          )}
        </Stack>
      </Panel>

      <Panel>
        <Stack gap="md">
          <SectionTitle>Случайная жеребьёвка</SectionTitle>
          <Text size="sm" c="dimmed">
            Снимает выданные бумажки и генерирует сектора заново (не из печатного пакета).
          </Text>
          <NumberInput
            label="Секторов в зоне"
            min={athletes.length || 1}
            max={200}
            value={sectorsPerZone}
            onChange={(v) => setSectorsPerZone(Number(v) || 40)}
            disabled={closed}
          />
          <Button
            color="signal"
            loading={randomMutation.isPending}
            disabled={closed || athletes.length === 0}
            onClick={() => {
              if (!window.confirm('Перезаписать текущую жеребьёвку случайной?')) return
              randomMutation.mutate()
            }}
          >
            Разыграть
          </Button>
          {randomMutation.isError && (
            <Text c="red" size="sm">
              {(randomMutation.error as Error).message}
            </Text>
          )}
        </Stack>
      </Panel>

      <Panel>
        <Stack gap="sm">
          <SectionTitle>Таблица</SectionTitle>
          {slipMutation.isError && (
            <Text c="red" size="sm">
              {(slipMutation.error as Error).message}
            </Text>
          )}
          {athletes.length === 0 ? (
            <Text c="dimmed" size="sm">
              Нет спортсменов в заявках.
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={880}>
              <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Спортсмен</Table.Th>
                    <Table.Th>Команда</Table.Th>
                    <Table.Th>Бумажка</Table.Th>
                    {slots.map((slot) => (
                      <Table.Th key={`${slot.tour}-${slot.mini}`}>
                        Т{slot.tour}·М{slot.mini}
                      </Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {athletes.map(({ member, teamName, partners }) => {
                    const currentSlip = slipById.get(member.draw_slip_id ?? '')
                    const partnerZones = partners
                      .map((p) => {
                        const sid = p.draw_slip_id
                        if (!sid) return null
                        return slipById.get(sid)?.start_zone ?? null
                      })
                      .filter((z): z is 'A' | 'B' => z === 'A' || z === 'B')
                    const requiredZone =
                      partnerZones.length > 0 ? oppositeZone(partnerZones[0]) : null
                    const slipOptions = slips
                      .filter((slip) => {
                        if (slip.id !== member.draw_slip_id && takenSlipIds.has(slip.id)) {
                          return false
                        }
                        if (requiredZone && slip.start_zone !== requiredZone) return false
                        return true
                      })
                      .map((slip) => ({
                        value: slip.id,
                        label: slipOptionLabel(slip),
                      }))
                    const assigning =
                      slipMutation.isPending &&
                      slipMutation.variables?.rosterMemberId === member.id
                    return (
                      <Table.Tr key={member.id}>
                        <Table.Td>
                          <Group gap={6} wrap="nowrap">
                            <Text>{member.full_name_snapshot}</Text>
                            {member.is_junior && (
                              <Badge size="xs" color="teal" variant="light">
                                Юниор
                              </Badge>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>{teamName}</Table.Td>
                        <Table.Td style={{ minWidth: 220 }}>
                          <Select
                            size="xs"
                            clearable={!assigning}
                            searchable
                            placeholder={
                              assigning
                                ? 'Сохраняем…'
                                : requiredZone
                                  ? `Зона ${requiredZone}`
                                  : 'Выбрать'
                            }
                            data={slipOptions}
                            value={member.draw_slip_id ?? null}
                            disabled={closed || slips.length === 0 || slipMutation.isPending}
                            rightSection={assigning ? <Loader size={14} /> : undefined}
                            rightSectionPointerEvents={assigning ? 'none' : undefined}
                            onChange={(value) =>
                              slipMutation.mutate({
                                rosterMemberId: member.id,
                                slipId: value,
                              })
                            }
                          />
                          {requiredZone && !currentSlip && (
                            <Text size="xs" c="dimmed" mt={4}>
                              Нужна зона {requiredZone} (напарник в{' '}
                              {oppositeZone(requiredZone)})
                            </Text>
                          )}
                          {currentSlip && (
                            <Text size="xs" c="dimmed" mt={4}>
                              {formatSlipCode(currentSlip.code)} · старт {currentSlip.start_zone}
                            </Text>
                          )}
                        </Table.Td>
                        {slots.map((slot) => {
                          const key = `${member.id}:${slot.tour}:${slot.mini}`
                          const row = drawMap.get(key)
                          const editing = editKey === key
                          return (
                            <Table.Td key={key}>
                              {editing ? (
                                <Stack gap={4}>
                                  <Select
                                    size="xs"
                                    data={format.zones.map((z) => ({ value: z, label: z }))}
                                    value={editZone}
                                    onChange={(v) => setEditZone(v ?? format.zones[0]!)}
                                  />
                                  <TextInput
                                    size="xs"
                                    type="number"
                                    value={String(editSector)}
                                    onChange={(e) => setEditSector(e.currentTarget.value)}
                                  />
                                  <Group gap={4}>
                                    <Button
                                      size="compact-xs"
                                      loading={saveEditMutation.isPending}
                                      onClick={() => saveEditMutation.mutate()}
                                    >
                                      OK
                                    </Button>
                                    <Button size="compact-xs" variant="subtle" onClick={() => setEditKey(null)}>
                                      ×
                                    </Button>
                                  </Group>
                                </Stack>
                              ) : (
                                <Button
                                  variant="subtle"
                                  size="compact-xs"
                                  disabled={closed}
                                  onClick={() => {
                                    setEditKey(key)
                                    setEditZone(row?.zone ?? format.zones[0]!)
                                    setEditSector(row?.sector ?? 1)
                                  }}
                                >
                                  {row ? `${row.zone}/${row.sector}` : '—'}
                                </Button>
                              )}
                            </Table.Td>
                          )
                        })}
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Stack>
      </Panel>
    </Stack>
  )
}
