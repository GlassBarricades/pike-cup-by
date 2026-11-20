import { useMemo, useState } from 'react'
import { Anchor, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { Link } from 'react-router-dom'
import { setPrimaryCheer, toggleCheer, useCheer, useCheerCounts } from '../../features/tournament/cheer'
import { getFormat, isIndividual } from '../../features/tournament/formats'
import { physicalZone } from '../../features/tournament/schedule'
import { slipSector } from '../../features/tournament/slips'
import { isIndividualSumBoardOpen } from '../../features/tournament/spectator'
import { EmptyState, FanLikes } from '../../ui'
import { useV2Tournament } from './context'

export function V2Teams() {
  const { tournament, entries, catches, miniTours, story, draws, results } = useV2Tournament()
  const individual = isIndividual(getFormat(tournament))
  const [query, setQuery] = useState('')
  const cheer = useCheer(tournament.id)
  const { data: fanCounts } = useCheerCounts(tournament.id)
  const slot = story.clock
  const individualSumOpen = isIndividualSumBoardOpen(catches, miniTours, tournament.status)

  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru')
    if (individual && results.engine === 'individual') {
      const list = results.teams.flatMap((row) => {
        const entry = entries.find((item) => item.id === row.entryId)
        if (!entry) return []
        const haystack = [row.teamName, ...row.athleteNames].join(' ').toLocaleLowerCase('ru')
        if (needle && !haystack.includes(needle)) return []
        const memberDraws = slot
          ? row.athleteIds
              .map((id) =>
                draws.find(
                  (d) =>
                    d.roster_member_id === id &&
                    d.tour_number === slot.tour &&
                    d.mini_number === slot.mini,
                ),
              )
              .filter(Boolean)
          : []
        const zones = [...new Set(memberDraws.map((d) => d!.zone))]
        const sectors = memberDraws.map((d) => d!.sector)
        const fans = fanCounts?.get(row.entryId) ?? 0
        return [
          {
            entryId: row.entryId,
            teamName: row.teamName,
            rosterNames: row.athleteNames,
            zone: zones.length === 1 ? zones[0]! : null,
            sector: sectors.length === 1 ? sectors[0]! : null,
            sectorNote:
              memberDraws.length > 1
                ? memberDraws.map((d) => `${d!.zone}${d!.sector}`).join(' · ')
                : null,
            fans,
            placeSum: row.placeSum,
            finalPlace: row.finalPlace,
          },
        ]
      })
      list.sort((a, b) => a.finalPlace - b.finalPlace || a.teamName.localeCompare(b.teamName, 'ru'))
      return list
    }

    const list = story.standings.flatMap((row) => {
      const entry = entries.find((item) => item.id === row.entryId)
      if (!entry) return []
      const haystack = [row.teamName, ...row.rosterNames].join(' ').toLocaleLowerCase('ru')
      if (needle && !haystack.includes(needle)) return []
      const zone = slot ? physicalZone(entry.start_zone ?? entry.draw_slip?.start_zone, slot.tour) : null
      const sector = slot ? slipSector(entry.draw_slip, slot.tour, slot.mini) : null
      const fans = fanCounts?.get(row.entryId) ?? 0
      return [
        {
          entryId: row.entryId,
          teamName: row.teamName,
          rosterNames: row.rosterNames,
          zone,
          sector,
          sectorNote: null as string | null,
          fans,
          placeSum: row.placeSum,
          finalPlace: row.finalPlace,
        },
      ]
    })
    list.sort((a, b) => b.fans - a.fans || a.teamName.localeCompare(b.teamName, 'ru'))
    return list
  }, [individual, results, story.standings, entries, slot, query, fanCounts, draws])

  if (rows.length === 0 && !query) return <EmptyState title="Заявок нет" />

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Команда или фамилия"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      {rows.length === 0 ? (
        <EmptyState title="Никого не нашли" />
      ) : (
        rows.map((row) => {
          const mine = cheer.entryIds.includes(row.entryId)
          return (
            <Group
              key={row.entryId}
              justify="space-between"
              align="flex-start"
              wrap="nowrap"
              py={6}
              style={{ borderBottom: '1px solid var(--pc-line)' }}
            >
              <div style={{ minWidth: 0 }}>
                <Group gap={8} wrap="nowrap" align="center">
                  <Anchor
                    component={Link}
                    to={`/live/t/${tournament.id}/team/${row.entryId}`}
                    fw={700}
                    c="inherit"
                    underline="never"
                  >
                    {row.teamName}
                  </Anchor>
                  <FanLikes
                    count={row.fans}
                    active={mine}
                    size="xs"
                    onToggle={() => toggleCheer(tournament.id, row.entryId)}
                  />
                </Group>
                <Text size="xs" c="dimmed">
                  {row.rosterNames.join(' · ')}
                </Text>
                <Text size="sm" mt={2}>
                  {tournament.draw_zones_only
                    ? row.zone
                      ? `Зона ${row.zone}`
                      : 'Зона ещё не назначена'
                    : row.sectorNote
                      ? row.sectorNote
                      : row.zone && row.sector != null
                        ? `Зона ${row.zone} · сектор ${row.sector}`
                        : 'Сектор ещё не открыт'}
                  {individual && individualSumOpen ? ` · Σ ${row.placeSum}` : ''}
                </Text>
              </div>
              {cheer.primaryId === row.entryId ? (
                <Text size="xs" c="var(--pc-signal)" style={{ flexShrink: 0 }}>
                  Главная
                </Text>
              ) : mine ? (
                <Button
                  size="compact-xs"
                  variant="default"
                  onClick={() => setPrimaryCheer(tournament.id, row.entryId)}
                >
                  Главная
                </Button>
              ) : null}
            </Group>
          )
        })
      )}
    </Stack>
  )
}
