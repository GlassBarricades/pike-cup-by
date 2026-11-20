import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Anchor, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useCheer } from '../../features/tournament/cheer'
import { isIndividual } from '../../features/tournament/formats'
import { getFormat } from '../../features/tournament/formats'
import { formatPlace } from '../../features/tournament/scoring'
import { physicalZone } from '../../features/tournament/schedule'
import {
  entryZonesWithCatch,
  gapLine,
  gramsLabel,
  isPlaceSumBoardOpen,
  isPlaceSumOpenForStart,
  startGroupToursOpened,
  sumGap,
  zoneExplanations,
  zoneGap,
} from '../../features/tournament/spectator'
import { useBoardMode, writeBoardMode, type BoardMode } from '../../features/tournament/v2Store'
import { EmptyState } from '../../ui'
import { IndividualResults } from '../public/IndividualResults'
import { useV2Tournament } from './context'
import { RulesComic } from './RulesComic'

const modes: { id: BoardMode; label: string }[] = [
  { id: 'all', label: 'Сумма' },
  { id: 'my-group', label: 'Моя группа' },
  { id: 'shore-a', label: 'Берег A' },
  { id: 'shore-b', label: 'Берег B' },
]

export function V2Table() {
  const { tournament, entries, catches, miniTours, story, results } = useV2Tournament()
  const mode = useBoardMode()
  const [comic, setComic] = useState(false)
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const defaultModeApplied = useRef(false)
  const cheerState = useCheer(tournament.id)
  const cheerId = cheerState.primaryId

  const cheer = story?.standings.find((row) => row.entryId === cheerId)
  const tour = story?.clock?.tour ?? 2

  const opened = useMemo(
    () => startGroupToursOpened(entries, catches, miniTours),
    [entries, catches, miniTours],
  )
  const sumBoardOpen = useMemo(
    () => isPlaceSumBoardOpen(opened, tournament.status),
    [opened, tournament.status],
  )

  useEffect(() => {
    if (defaultModeApplied.current) return
    if (!story) return
    defaultModeApplied.current = true
    if (!sumBoardOpen && mode === 'all') writeBoardMode('shore-a')
  }, [story, sumBoardOpen, mode])

  const effectiveMode: BoardMode = !sumBoardOpen && mode === 'all' ? 'shore-a' : mode

  const rows = useMemo(() => {
    if (!story) return []
    const needle = query.trim().toLocaleLowerCase('ru')
    const filtered = story.standings.filter((row) => {
      if (effectiveMode === 'my-group' && cheer && row.startZone !== cheer.startZone) return false
      if (effectiveMode === 'shore-a' && physicalZone(row.startZone, tour) !== 'A') return false
      if (effectiveMode === 'shore-b' && physicalZone(row.startZone, tour) !== 'B') return false
      if (!needle) return true
      const haystack = [row.teamName, ...row.rosterNames].join(' ').toLocaleLowerCase('ru')
      return haystack.includes(needle)
    })

    const sorted = [...filtered]
    if (effectiveMode === 'all' && sumBoardOpen) {
      sorted.sort((a, b) => a.finalPlace - b.finalPlace || b.totalWeight - a.totalWeight)
    } else {
      const shore: 'A' | 'B' =
        effectiveMode === 'shore-b' ? 'B' : effectiveMode === 'shore-a' ? 'A' : physicalZone(cheer?.startZone ?? 'A', tour) === 'B' ? 'B' : 'A'
      sorted.sort((a, b) => {
        const placeA = shore === 'B' ? a.zoneBPlace : a.zoneAPlace
        const placeB = shore === 'B' ? b.zoneBPlace : b.zoneAPlace
        const weightA = shore === 'B' ? a.zoneBWeight : a.zoneAWeight
        const weightB = shore === 'B' ? b.zoneBWeight : b.zoneAWeight
        return placeA - placeB || weightB - weightA
      })
    }
    return sorted
  }, [story, effectiveMode, cheer, tour, query, sumBoardOpen])

  if (isIndividual(getFormat(tournament)) && results.engine === 'individual') {
    return (
      <IndividualResults
        teams={results.teams}
        athletes={results.athletes}
        juniors={results.juniors}
        catches={catches}
        miniTours={miniTours}
        tournamentStatus={tournament.status}
      />
    )
  }

  if (!story) return <EmptyState title="Нет данных" />

  const showSumColumns = sumBoardOpen && effectiveMode === 'all'

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {sumBoardOpen
          ? 'В зачёт идёт сумма мест по двум зонам. Нажатие на строку открывает отрыв и пояснение.'
          : 'Пока идёт первая зона — смотрите места по берегам. Сумма откроется после взвешивания обеих зон.'}
      </Text>
      <Group justify="space-between" align="center">
        <Button size="xs" variant="default" onClick={() => setComic(true)}>
          Как считается место
        </Button>
        <Button component={Link} to={`/live/t/${tournament.id}/compare`} size="xs" variant="light">
          Сравнить две команды
        </Button>
      </Group>
      {comic ? <RulesComic onClose={() => setComic(false)} /> : null}
      <TextInput
        placeholder="Команда или фамилия"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <Group gap={6} wrap="wrap">
        {modes.map((item) => (
          <Button
            key={item.id}
            size="xs"
            variant={effectiveMode === item.id ? 'filled' : 'default'}
            disabled={item.id === 'all' && !sumBoardOpen}
            onClick={() => writeBoardMode(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </Group>
      {effectiveMode === 'my-group' && !cheer ? (
        <Text size="sm" c="dimmed">
          Отметьте «Болею» у команды в списке команд — тогда здесь останется её стартовая группа.
        </Text>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title={query.trim() ? 'Никого не нашли' : 'В этом срезе никого нет'} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={headPlace}>Место</th>
                <th style={headName}>Команда</th>
                {showSumColumns ? <th style={headNum}>Сумма</th> : null}
                <th style={headNum}>Вес</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const open = openId === row.entryId
                const entry = entries.find((item) => item.id === row.entryId)
                const zonesOpened = entry ? entryZonesWithCatch(entry, catches, miniTours) : { A: false, B: false }
                const notes = zoneExplanations(row, story.standings, story.zeroPlusOne, zonesOpened)
                const shore = physicalZone(row.startZone, tour)
                const sumOpen = isPlaceSumOpenForStart(row.startZone, opened)
                const gap =
                  showSumColumns && sumOpen
                    ? sumGap(row, story.standings)
                    : shore
                      ? zoneGap(row, story.standings, shore)
                      : sumGap(row, story.standings)
                const weightPlace = story.weightPlaces.get(row.entryId)
                const boardShore: 'A' | 'B' =
                  effectiveMode === 'shore-b' ? 'B' : effectiveMode === 'shore-a' ? 'A' : shore ?? 'A'
                const zonePlace = boardShore === 'B' ? row.zoneBPlace : row.zoneAPlace
                const zoneWeight = boardShore === 'B' ? row.zoneBWeight : row.zoneAWeight
                const displayPlace = showSumColumns && sumOpen ? row.finalPlace : zonePlace
                const displayWeight = showSumColumns && sumOpen ? row.totalWeight : zoneWeight
                return (
                  <Fragment key={row.entryId}>
                    <tr
                      onClick={() => setOpenId(open ? null : row.entryId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setOpenId(open ? null : row.entryId)
                        }
                      }}
                      tabIndex={0}
                      aria-expanded={open}
                      style={{
                        cursor: 'pointer',
                        background: cheerState.entryIds.includes(row.entryId)
                          ? 'color-mix(in srgb, var(--pc-signal) 16%, transparent)'
                          : undefined,
                      }}
                    >
                      <td style={cellPlace}>{formatPlace(displayPlace)}</td>
                      <td style={cellName}>{row.teamName}</td>
                      {showSumColumns ? (
                        <td style={cellNum}>{sumOpen ? formatPlace(row.placeSum) : '—'}</td>
                      ) : null}
                      <td style={cellNum}>{gramsLabel(displayWeight)}</td>
                    </tr>
                    {open ? (
                      <tr>
                        <td colSpan={showSumColumns ? 4 : 3} style={detailCell}>
                          <Text size="xs" c="dimmed">
                            {row.rosterNames.join(' · ') || 'Состав не указан'}
                          </Text>
                          {sumOpen ? (
                            <Text size="sm" mt={4}>
                              Сумма мест {formatPlace(row.placeSum)}
                              {weightPlace != null ? ` · если по весу ${formatPlace(weightPlace)}` : ''}
                            </Text>
                          ) : (
                            <Text size="sm" mt={4} c="dimmed">
                              Сумма мест появится после взвешивания обеих зон
                            </Text>
                          )}
                          <Text size="sm" className="pc-tabular" c="dimmed">
                            {gramsLabel(row.totalWeight)} · A {gramsLabel(row.zoneAWeight)} · B{' '}
                            {gramsLabel(row.zoneBWeight)}
                          </Text>
                          {gapLine(gap) ? (
                            <Text size="sm" mt={4}>
                              {gapLine(gap)}
                            </Text>
                          ) : null}
                          {notes.map((note) => (
                            <Text key={note} size="xs" c="dimmed" mt={2}>
                              {note}
                            </Text>
                          ))}
                          <Anchor
                            component={Link}
                            to={`/live/t/${tournament.id}/team/${row.entryId}`}
                            size="sm"
                            mt={6}
                            style={{ display: 'block' }}
                            onClick={(event) => event.stopPropagation()}
                          >
                            Страница команды
                          </Anchor>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  )
}

const headPlace: CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  fontSize: 12,
  fontWeight: 600,
  width: 52,
}

const headName: CSSProperties = {
  textAlign: 'left',
  padding: '6px 8px',
  fontSize: 12,
  fontWeight: 600,
}

const headNum: CSSProperties = {
  textAlign: 'right',
  padding: '6px 8px',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const cellPlace: CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid var(--pc-line)',
  fontWeight: 700,
  color: 'var(--pc-signal)',
  fontVariantNumeric: 'tabular-nums',
  width: 52,
}

const cellName: CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid var(--pc-line)',
  fontWeight: 700,
}

const cellNum: CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid var(--pc-line)',
  textAlign: 'right',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
}

const detailCell: CSSProperties = {
  padding: '8px 8px 12px',
  borderBottom: '1px solid var(--pc-line)',
  background: 'var(--pc-panel)',
}
