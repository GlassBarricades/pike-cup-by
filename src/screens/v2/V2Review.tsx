import { useMemo, useState, type ReactElement } from 'react'
import { Button, Group, Select, Slider, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { Navigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts'
import { useCheer } from '../../features/tournament/cheer'
import { useSeasonDigest } from '../../features/tournament/season'
import { getCompetitionStage } from '../../features/tournament/schedule'
import { formatPlace } from '../../features/tournament/scoring'
import {
  chartColors,
  cupAgainst,
  cumulativeSeries,
  decidedAfter,
  extremeSlots,
  gapSentence,
  gramGaps,
  hasWeights,
  lastWeighedIndex,
  neighborBars,
  placeCompare,
  placeJumps,
  placeSumSeries,
  radarAxes,
  replayRows,
  seasonPairStats,
  seasonPlaceSeries,
  seasonSectorPoints,
  sectorAverages,
  sectorLuck,
  shoreBars,
  shoreDecision,
  shorePlaces,
  slipPoints,
  slotAverageBars,
  teamSlotBars,
  topIds,
  weightPlacePoints,
  weightShare,
  windowPlaceSeries,
  zoneSectorBars,
} from '../../features/tournament/review'
import { ISLAND_PATH, LAKE_FRAME, LAKE_LABELS, WATER_PATH, outward, sectorPoints } from '../../features/tournament/lake'
import { pairKey, rivalsForNames, sectorHistory, type SeasonBundle } from '../../features/tournament/spectator'
import { useNow } from '../../features/tournament/useNow'
import { EmptyState, Panel } from '../../ui'
import { useV2Tournament } from './context'

type Tab = 'day' | 'shores' | 'sectors' | 'teams' | 'season'
type Zone = 'A' | 'B'

const tabs: { id: Tab; label: string }[] = [
  { id: 'day', label: 'День' },
  { id: 'shores', label: 'Берега' },
  { id: 'sectors', label: 'Секторы' },
  { id: 'teams', label: 'Команды' },
  { id: 'season', label: 'Сезон' },
]

const tick = { fill: 'var(--pc-muted)', fontSize: 11 }
const tipStyle = {
  contentStyle: { background: 'var(--pc-panel)', border: '1px solid var(--pc-line)', color: 'var(--pc-text)' },
}

function Frame({ title, note, height = 280, children }: { title: string; note?: string; height?: number; children: ReactElement }) {
  return (
    <Panel p="sm">
      <Text size="xs" c="dimmed" tt="uppercase">
        {title}
      </Text>
      {note ? (
        <Text size="sm" c="dimmed" mt={4}>
          {note}
        </Text>
      ) : null}
      <div style={{ width: '100%', height, marginTop: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

function readSlot(state: unknown): string | null {
  const payload = (state as { activePayload?: { payload?: { slot?: string } }[] } | null)?.activePayload?.[0]?.payload
  return payload?.slot ?? null
}

export function V2Review() {
  const { tournament, segments, story } = useV2Tournament()
  const now = useNow(5_000)
  const cheer = useCheer(tournament.id)
  const [tab, setTab] = useState<Tab>('day')
  const [picked, setPicked] = useState<string | null>(null)
  const [other, setOther] = useState<string | null>(null)
  const [slotMark, setSlotMark] = useState<string | null>(null)
  const [zone, setZone] = useState<Zone>('A')
  const [onlyMine, setOnlyMine] = useState(false)
  const season = useSeasonDigest(tab === 'season')
  const stage = getCompetitionStage(tournament, segments, now)

  const names = useMemo(() => new Map(story.standings.map((row) => [row.entryId, row.teamName])), [story.standings])
  const ordered = [...story.standings].sort((a, b) => a.finalPlace - b.finalPlace)
  const winner = ordered[0]
  const entryId = picked && names.has(picked) ? picked : (winner?.entryId ?? null)
  const fallback = ordered.find((row) => row.entryId !== entryId)
  const compareId = other && other !== entryId && names.has(other) ? other : (fallback?.entryId ?? null)
  const slotIndex = Math.max(0, story.slots.findIndex((slot) => `${slot.tour}.${slot.mini}` === slotMark))
  const shownSlot = slotMark ? slotIndex : lastWeighedIndex(story)
  const lineIds = onlyMine ? cheer.entryIds.filter((id) => names.has(id)) : topIds(story)
  const weighed = hasWeights(story)

  if (stage !== 'completed') return <Navigate to={`/live/t/${tournament.id}`} replace />

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>{tournament.name}</Title>
        <Text size="sm" c="dimmed">
          Разбор дня
        </Text>
      </div>
      <Group gap={6} wrap="wrap">
        {tabs.map((item) => (
          <Button key={item.id} size="xs" variant={tab === item.id ? 'filled' : 'default'} onClick={() => setTab(item.id)}>
            {item.label}
          </Button>
        ))}
      </Group>
      {tab === 'season' ? null : (
        <Select
          placeholder="Команда"
          value={entryId}
          data={[...story.standings]
            .sort((a, b) => a.finalPlace - b.finalPlace)
            .map((row) => ({ value: row.entryId, label: row.teamName }))}
          onChange={setPicked}
          searchable
        />
      )}
      {tab === 'day' ? (
        <DayPane
          ids={lineIds}
          names={names}
          entryId={entryId}
          compareId={compareId}
          onlyMine={onlyMine}
          cheerCount={cheer.entryIds.length}
          weighed={weighed}
          slotIndex={shownSlot}
          onTeam={setPicked}
          onCompare={setOther}
          onSlot={setSlotMark}
          onOnlyMine={() => setOnlyMine((value) => !value)}
        />
      ) : null}
      {tab === 'shores' ? <ShoresPane weighed={weighed} onTeam={setPicked} /> : null}
      {tab === 'sectors' ? (
        <SectorsPane weighed={weighed} entryId={entryId} slotIndex={shownSlot} zone={zone} onZone={setZone} onSlot={setSlotMark} onTeam={setPicked} />
      ) : null}
      {tab === 'teams' ? <TeamsPane weighed={weighed} entryId={entryId} onTeam={setPicked} /> : null}
      {tab === 'season' ? <SeasonPane loading={season.isLoading} bundles={season.data ?? []} /> : null}
    </Stack>
  )
}

function DayPane({
  ids,
  names,
  entryId,
  compareId,
  onlyMine,
  cheerCount,
  weighed,
  slotIndex,
  onTeam,
  onCompare,
  onSlot,
  onOnlyMine,
}: {
  ids: string[]
  names: Map<string, string>
  entryId: string | null
  compareId: string | null
  onlyMine: boolean
  cheerCount: number
  weighed: boolean
  slotIndex: number
  onTeam: (id: string) => void
  onCompare: (id: string) => void
  onSlot: (slot: string) => void
  onOnlyMine: () => void
}) {
  const { story } = useV2Tournament()
  if (!weighed) return <EmptyState title="Весов ещё нет" description="Разбор появится после первых взвешиваний." />
  const lines = placeSumSeries(story, ids)
  const windows = windowPlaceSeries(story, ids)
  const decision = decidedAfter(story)
  const ends = extremeSlots(story)
  const averages = slotAverageBars(story)
  const jumps = placeJumps(story)
  const team = entryId ? teamSlotBars(story, entryId) : []
  const grown = cumulativeSeries(story, ids)
  const pairIds = [entryId, compareId].filter((id): id is string => Boolean(id))
  const pairLines = placeSumSeries(story, pairIds)
  const pairWeight = cumulativeSeries(story, pairIds)
  const replay = replayRows(story, slotIndex)
  const replayHead = replay.slice(0, 12)
  const replayExtra = entryId && !replayHead.some((row) => row.entryId === entryId) ? replay.find((row) => row.entryId === entryId) : null
  const replayShown = replayExtra ? [...replayHead, replayExtra] : replayHead
  const slot = story.slots[slotIndex]
  const records = story.records
  const options = [...story.standings]
    .sort((a, b) => a.finalPlace - b.finalPlace)
    .filter((row) => row.entryId !== entryId)
    .map((row) => ({ value: row.entryId, label: row.teamName }))
  return (
    <Stack gap="sm">
      <Group gap={6}>
        <Button size="xs" variant={onlyMine ? 'filled' : 'default'} onClick={onOnlyMine}>
          Только мои
        </Button>
        <Text size="sm" c="dimmed">
          {onlyMine && cheerCount === 0 ? 'Отметьте «Болею» на странице команд.' : 'Ниже линия — меньше сумма мест.'}
        </Text>
      </Group>
      <Group grow align="stretch">
        {records.heaviestMini ? (
          <Panel p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Тяжёлое окно</Text>
            <UnstyledButton onClick={() => onTeam(records.heaviestMini!.entryId)}>
              <Text fw={700}>{records.heaviestMini.teamName}</Text>
            </UnstyledButton>
            <Text size="sm">{records.heaviestMini.grams.toLocaleString('ru-RU')} г · {records.heaviestMini.tour}.{records.heaviestMini.mini}</Text>
          </Panel>
        ) : null}
        {records.biggestJump ? (
          <Panel p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Скачок в группе</Text>
            <UnstyledButton onClick={() => onTeam(records.biggestJump!.entryId)}>
              <Text fw={700}>{records.biggestJump.teamName}</Text>
            </UnstyledButton>
            <Text size="sm">
              {formatPlace(records.biggestJump.from)} → {formatPlace(records.biggestJump.to)}
              {records.biggestJump.tour && records.biggestJump.mini ? ` · ${records.biggestJump.tour}.${records.biggestJump.mini}` : ''}
            </Text>
          </Panel>
        ) : null}
        {records.driestZone ? (
          <Panel p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Сухой берег</Text>
            <Text fw={700}>Зона {records.driestZone.zone}</Text>
            <Text size="sm">
              {records.driestZone.zeros} нулей из {records.driestZone.weighed} · {Math.round(records.driestZone.zeroShare * 100)}%
            </Text>
          </Panel>
        ) : null}
      </Group>
      {slot ? (
        <Panel p="sm">
          <Group justify="space-between" mb={6}>
            <Text size="xs" c="dimmed" tt="uppercase">Таблица после окна</Text>
            <Text fw={700}>{slot.tour}.{slot.mini}</Text>
          </Group>
          <Text size="sm" c="dimmed" mb="sm">
            Место и сумма — протокол на этот момент. Колонка «Окно» — место только этого взвешивания.
          </Text>
          <Slider
            min={0}
            max={Math.max(0, story.slots.length - 1)}
            value={slotIndex}
            onChange={(value) => {
              const next = story.slots[value]
              if (next) onSlot(`${next.tour}.${next.mini}`)
            }}
            label={(value) => {
              const next = story.slots[value]
              return next ? `${next.tour}.${next.mini}` : ''
            }}
            marks={story.slots.map((item, index) => ({ value: index, label: `${item.tour}.${item.mini}` }))}
            mb={28}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '2.5rem 1fr 4rem 5rem 3.2rem', gap: 4, padding: '0 6px 4px' }}>
            <Text size="xs" c="dimmed">#</Text>
            <Text size="xs" c="dimmed">Команда</Text>
            <Text size="xs" c="dimmed">Сумма</Text>
            <Text size="xs" c="dimmed">Вес</Text>
            <Text size="xs" c="dimmed">Окно</Text>
          </div>
          <Stack gap={2}>
            {replayShown.map((row) => (
              <UnstyledButton
                key={row.entryId}
                onClick={() => onTeam(row.entryId)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.5rem 1fr 4rem 5rem 3.2rem',
                  gap: 4,
                  padding: '4px 6px',
                  textAlign: 'left',
                  color: 'inherit',
                  borderRadius: 6,
                  background: row.entryId === entryId ? 'color-mix(in srgb, var(--pc-signal) 16%, transparent)' : undefined,
                }}
              >
                <Text size="sm">{row.place}</Text>
                <Text size="sm">{row.name}</Text>
                <Text size="sm">{formatPlace(row.sum)}</Text>
                <Text size="sm">{row.weight.toLocaleString('ru-RU')}</Text>
                <Text size="sm">{row.windowPlace ?? '—'}</Text>
              </UnstyledButton>
            ))}
          </Stack>
        </Panel>
      ) : null}
      {ids.length === 0 ? null : (
        <Frame title="Сумма мест по окнам" height={320}>
          <LineChart data={lines}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis dataKey="slot" tick={tick} />
            <YAxis tick={tick} width={32} />
            <Tooltip {...tipStyle} />
            <Legend />
            {ids.map((id, index) => (
              <Line key={id} type="monotone" dataKey={id} name={names.get(id) ?? id} stroke={chartColors[index % chartColors.length]} dot={false} connectNulls />
            ))}
          </LineChart>
        </Frame>
      )}
      {ids.length === 0 ? null : (
        <Frame title="Место в окне" note="Только это взвешивание, внутри своей зоны. Пустой тур сюда не входит. Ниже линия — лучше место." height={320}>
          <LineChart data={windows}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis dataKey="slot" tick={tick} />
            <YAxis tick={tick} width={32} />
            <Tooltip {...tipStyle} />
            <Legend />
            {ids.map((id, index) => (
              <Line key={id} type="monotone" dataKey={id} name={names.get(id) ?? id} stroke={chartColors[index % chartColors.length]} dot={false} connectNulls />
            ))}
          </LineChart>
        </Frame>
      )}
      {decision ? (
        <Panel p="sm">
          <Text fw={700}>{decision.fromStart ? `${decision.leaderName} впереди с первого окна` : `После ${decision.slot} впереди осталась ${decision.leaderName}`}</Text>
        </Panel>
      ) : null}
      <Group grow align="stretch">
        <Panel p="sm">
          <Text size="xs" c="dimmed" tt="uppercase">Тяжёлый слот</Text>
          <Text fw={700}>{ends.heaviest ? `${ends.heaviest.title} · ${ends.heaviest.avg.toLocaleString('ru-RU')} г` : '—'}</Text>
        </Panel>
        <Panel p="sm">
          <Text size="xs" c="dimmed" tt="uppercase">Сухой слот</Text>
          <Text fw={700}>{ends.driest ? `${ends.driest.title} · ${ends.driest.avg.toLocaleString('ru-RU')} г · нули ${ends.driest.zeros}` : '—'}</Text>
        </Panel>
      </Group>
      <Frame title="Средний вес окна" note="Нажатие выбирает слот для вкладки секторов.">
        <BarChart data={averages} onClick={(state) => { const slot = readSlot(state); if (slot) onSlot(slot) }}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="slot" tick={tick} />
          <YAxis tick={tick} width={40} />
          <Tooltip {...tipStyle} />
          <Bar dataKey="avg" name="Средний вес" fill="var(--pc-signal)" />
        </BarChart>
      </Frame>
      {entryId ? (
        <Frame title={`${names.get(entryId) ?? 'Команда'} · вес и место`} note="Столбец — граммы окна, линия — место в группе.">
          <ComposedChart data={team}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis dataKey="slot" tick={tick} />
            <YAxis yAxisId="grams" tick={tick} width={40} />
            <YAxis yAxisId="place" orientation="right" tick={tick} width={28} />
            <Tooltip {...tipStyle} />
            <Bar yAxisId="grams" dataKey="grams" name="Вес" fill="var(--pc-signal)" />
            <Line yAxisId="place" type="monotone" dataKey="place" name="Место" stroke="var(--pc-zone-a)" connectNulls />
          </ComposedChart>
        </Frame>
      ) : null}
      {ids.length > 0 ? (
        <Frame title="Накопленный вес">
          <AreaChart data={grown}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis dataKey="slot" tick={tick} />
            <YAxis tick={tick} width={40} />
            <Tooltip {...tipStyle} />
            <Legend />
            {ids.map((id, index) => (
              <Area key={id} type="monotone" dataKey={id} name={names.get(id) ?? id} stroke={chartColors[index % chartColors.length]} fill={chartColors[index % chartColors.length]} fillOpacity={0.15} />
            ))}
          </AreaChart>
        </Frame>
      ) : null}
      {pairIds.length === 2 ? (
        <Stack gap="sm">
          <Select placeholder="Сравнить с" value={compareId} data={options} onChange={(value) => { if (value) onCompare(value) }} searchable />
          <Frame title="Две команды · сумма мест" note="Ниже линия — меньше сумма мест, вместе с ещё не сыгранным туром.">
            <LineChart data={pairLines}>
              <CartesianGrid stroke="var(--pc-line)" />
              <XAxis dataKey="slot" tick={tick} />
              <YAxis tick={tick} width={32} />
              <Tooltip {...tipStyle} />
              <Legend />
              {pairIds.map((id, index) => (
                <Line key={id} type="monotone" dataKey={id} name={names.get(id) ?? id} stroke={chartColors[index % chartColors.length]} dot={false} connectNulls />
              ))}
            </LineChart>
          </Frame>
          <Frame title="Две команды · накопленный вес">
            <LineChart data={pairWeight}>
              <CartesianGrid stroke="var(--pc-line)" />
              <XAxis dataKey="slot" tick={tick} />
              <YAxis tick={tick} width={40} />
              <Tooltip {...tipStyle} />
              <Legend />
              {pairIds.map((id, index) => (
                <Line key={id} type="monotone" dataKey={id} name={names.get(id) ?? id} stroke={chartColors[index % chartColors.length]} dot={false} connectNulls />
              ))}
            </LineChart>
          </Frame>
        </Stack>
      ) : null}
      {jumps.length > 0 ? (
        <Frame title="Скачки суммы мест" note="Положительное число — столько мест отыграли за соседние окна." height={Math.max(240, jumps.length * 36)}>
          <BarChart data={jumps} layout="vertical" onClick={(state) => {
            const id = (state as { activePayload?: { payload?: { entryId?: string } }[] } | null)?.activePayload?.[0]?.payload?.entryId
            if (id) onTeam(id)
          }}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis type="number" tick={tick} />
            <YAxis type="category" dataKey="teamName" tick={tick} width={120} />
            <Tooltip {...tipStyle} />
            <Bar dataKey="delta" name="Мест" fill="var(--pc-zone-b)" />
          </BarChart>
        </Frame>
      ) : null}
    </Stack>
  )
}

function ShoresPane({ weighed, onTeam }: { weighed: boolean; onTeam: (id: string) => void }) {
  const { story } = useV2Tournament()
  if (!weighed) return <EmptyState title="Весов ещё нет" />
  const bars = shoreBars(story)
  const places = shorePlaces(story)
  return (
    <Stack gap="sm">
      <Frame title="Средний вес берегов">
        <BarChart data={bars}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="slot" tick={tick} />
          <YAxis tick={tick} width={40} />
          <Tooltip {...tipStyle} />
          <Legend />
          <Bar dataKey="a" name="Зона A" fill="var(--pc-zone-a)" />
          <Bar dataKey="b" name="Зона B" fill="var(--pc-zone-b)" />
        </BarChart>
      </Frame>
      <Frame title="Нули по окнам">
        <BarChart data={bars}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="slot" tick={tick} />
          <YAxis tick={tick} width={28} allowDecimals={false} />
          <Tooltip {...tipStyle} />
          <Legend />
          <Bar dataKey="zerosA" name="Нули A" fill="var(--pc-zone-a)" />
          <Bar dataKey="zerosB" name="Нули B" fill="var(--pc-zone-b)" />
        </BarChart>
      </Frame>
      <Frame title="Место на каждом берегу" note="Короткий столбец — удачный берег." height={Math.max(280, places.length * 28)}>
        <BarChart data={places} layout="vertical" onClick={(state) => {
          const id = (state as { activePayload?: { payload?: { entryId?: string } }[] } | null)?.activePayload?.[0]?.payload?.entryId
          if (id) onTeam(id)
        }}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis type="number" tick={tick} />
          <YAxis type="category" dataKey="name" tick={tick} width={120} />
          <Tooltip {...tipStyle} />
          <Legend />
          <Bar dataKey="a" name="Зона A" fill="var(--pc-zone-a)" />
          <Bar dataKey="b" name="Зона B" fill="var(--pc-zone-b)" />
        </BarChart>
      </Frame>
    </Stack>
  )
}

function ShoreHeat({
  heat,
  picked,
  history,
  onPick,
}: {
  heat: { zone: Zone; sector: number; grams: number }[]
  picked: { zone: Zone; sector: number } | null
  history: { tour: 1 | 2; mini: number; entryId: string; teamName: string; grams: number | null }[]
  onPick: (pick: { zone: Zone; sector: number }) => void
}) {
  const gramsOf = new Map(heat.map((cell) => [`${cell.zone}:${cell.sector}`, cell.grams]))
  const hottest = Math.max(1, ...heat.map((cell) => cell.grams))
  const shoreGrams = { A: 0, B: 0 }
  for (const cell of heat) shoreGrams[cell.zone] += cell.grams
  const pickedGrams = picked ? gramsOf.get(`${picked.zone}:${picked.sector}`) : null
  return (
    <Panel p="sm">
      <Text size="xs" c="dimmed" tt="uppercase">Где стояла рыба</Text>
      <Text size="sm" c="dimmed" mt={4}>
        Ярче сектор — больше грамм за день на этом месте берега. Зона A {shoreGrams.A.toLocaleString('ru-RU')} г, зона B {shoreGrams.B.toLocaleString('ru-RU')} г.
      </Text>
      <div style={{ width: '100%', maxWidth: 680, margin: '12px auto 0', aspectRatio: `${LAKE_FRAME.width} / ${LAKE_FRAME.height}` }}>
        <svg viewBox={`${LAKE_FRAME.x} ${LAKE_FRAME.y} ${LAKE_FRAME.width} ${LAKE_FRAME.height}`} width="100%" height="100%" role="img" aria-label="Тепловая карта дня">
          <path d={WATER_PATH} fill="color-mix(in srgb, #2f6f9f 42%, var(--pc-panel))" stroke="color-mix(in srgb, var(--pc-text) 28%, #2f6f9f)" strokeWidth={2} />
          <path d={ISLAND_PATH} fill="color-mix(in srgb, #6b8f71 45%, var(--pc-panel))" stroke="var(--pc-line)" strokeWidth={1.2} />
          <text x={LAKE_LABELS.zoneA.x} y={LAKE_LABELS.zoneA.y} fill="var(--pc-zone-a)" fontSize={16} fontWeight={700} style={{ fontFamily: 'var(--pc-font-display)' }}>Зона A</text>
          <text x={LAKE_LABELS.zoneB.x} y={LAKE_LABELS.zoneB.y} fill="var(--pc-zone-b)" fontSize={16} fontWeight={700} style={{ fontFamily: 'var(--pc-font-display)' }}>Зона B</text>
          {(['A', 'B'] as const).map((zone) =>
            sectorPoints(zone).map((point, index) => {
              const sector = index + 1
              const grams = gramsOf.get(`${zone}:${sector}`)
              const weighed = grams != null
              const mix = weighed ? Math.round(28 + (grams / hottest) * 72) : 0
              const fill = weighed ? `color-mix(in srgb, var(--pc-signal) ${mix}%, ${zone === 'A' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'})` : zone === 'A' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'
              const label = outward(point, -14)
              const selected = picked?.zone === zone && picked.sector === sector
              const radius = weighed ? 4.5 + (grams / hottest) * 8 : 3.2
              return (
                <g key={`${zone}-${sector}`} style={{ cursor: 'pointer' }} onClick={() => onPick({ zone, sector })}>
                  <title>{`Зона ${zone} · сектор ${sector}${weighed ? ` · ${grams.toLocaleString('ru-RU')} г` : ''}`}</title>
                  <circle cx={point.x} cy={point.y} r={selected ? radius + 2 : radius} fill={fill} opacity={weighed ? 1 : 0.35} stroke={selected ? 'var(--pc-text)' : 'none'} strokeWidth={1.5} />
                  <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fill="var(--pc-text)" stroke="var(--pc-panel)" strokeWidth={2} paintOrder="stroke" fontSize={8} style={{ fontFamily: 'var(--pc-font-body)', pointerEvents: 'none' }}>
                    {sector}
                  </text>
                </g>
              )
            }),
          )}
        </svg>
      </div>
      {picked ? (
        <Stack gap={2} mt="sm">
          <Text fw={700}>
            Зона {picked.zone} · сектор {picked.sector}
            {pickedGrams != null ? ` · ${pickedGrams.toLocaleString('ru-RU')} г` : ' · взвешиваний нет'}
          </Text>
          {history.map((row) => (
            <Text key={`${row.tour}.${row.mini}.${row.entryId}`} size="sm" c="dimmed">
              {row.tour}.{row.mini} {row.teamName}
              {row.grams != null ? ` · ${row.grams.toLocaleString('ru-RU')} г` : ''}
            </Text>
          ))}
        </Stack>
      ) : null}
    </Panel>
  )
}

function SectorsPane({
  weighed,
  entryId,
  slotIndex,
  zone,
  onZone,
  onSlot,
  onTeam,
}: {
  weighed: boolean
  entryId: string | null
  slotIndex: number
  zone: Zone
  onZone: (zone: Zone) => void
  onSlot: (slot: string) => void
  onTeam: (id: string) => void
}) {
  const { story, entries, catches, miniTours } = useV2Tournament()
  const [shorePick, setShorePick] = useState<{ zone: Zone; sector: number } | null>(null)
  if (!weighed) return <EmptyState title="Весов ещё нет" />
  const averages = sectorAverages(story)
  const route = entryId ? slipPoints(story, entryId) : []
  const luck = entryId ? sectorLuck(story, entryId) : []
  const neighbors = entryId ? neighborBars(story, entryId, slotIndex) : []
  const cells = zoneSectorBars(story, slotIndex, zone)
  const slot = story.slots[slotIndex]
  const neighborZone = neighbors[0]?.zone
  if (averages.length === 0) {
    return (
      <Panel p="sm">
        <Text size="sm" c="dimmed">В бумажках этого турнира нет номеров секторов, поэтому карта берега, удача номера и соседи не из чего сложиться.</Text>
      </Panel>
    )
  }
  return (
    <Stack gap="sm">
      <ShoreHeat
        heat={story.heatDay}
        picked={shorePick}
        history={shorePick ? sectorHistory(entries, catches, miniTours, story.slots, shorePick.zone, shorePick.sector) : []}
        onPick={setShorePick}
      />
      <Frame title="Средний вес номера сектора">
        <BarChart data={averages}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="sector" tick={tick} />
          <YAxis tick={tick} width={40} />
          <Tooltip {...tipStyle} />
          <Bar dataKey="avg" name="Средний вес" fill="var(--pc-signal)" />
        </BarChart>
      </Frame>
      <Frame title="Маршрут бумажки" note="Точка — сектор и вес окна выбранной команды.">
        <ScatterChart>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="sector" name="Сектор" tick={tick} />
          <YAxis dataKey="grams" name="Вес" tick={tick} width={40} />
          <Tooltip {...tipStyle} />
          <Scatter data={route} fill="var(--pc-signal)" />
        </ScatterChart>
      </Frame>
      {luck.length > 0 ? (
        <Frame title="Удача номера" note="Столбец — вес команды. Линия — средний вес этого номера у остальных за день.">
          <ComposedChart data={luck}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis dataKey="label" tick={tick} interval={0} angle={-35} height={48} textAnchor="end" />
            <YAxis tick={tick} width={40} />
            <Tooltip {...tipStyle} />
            <Legend />
            <Bar dataKey="grams" name="Команда" fill="var(--pc-signal)" />
            <Line type="monotone" dataKey="avg" name="Номер у остальных" stroke="var(--pc-zone-b)" connectNulls />
          </ComposedChart>
        </Frame>
      ) : null}
      {neighbors.length > 0 ? (
        <Frame title="Соседи по бумажке" note={neighborZone && slot ? `Зона ${neighborZone} · окно ${slot.tour}.${slot.mini}. Яркий столбец — выбранная команда.` : undefined} height={Math.max(220, neighbors.length * 36)}>
          <BarChart data={neighbors} layout="vertical" onClick={(state) => {
            const id = (state as { activePayload?: { payload?: { entryId?: string } }[] } | null)?.activePayload?.[0]?.payload?.entryId
            if (id) onTeam(id)
          }}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis type="number" tick={tick} />
            <YAxis type="category" dataKey="name" tick={tick} width={120} />
            <Tooltip {...tipStyle} />
            <Bar dataKey="grams" name="Вес">
              {neighbors.map((item) => (
                <Cell key={item.entryId} fill={item.mine ? 'var(--pc-signal)' : item.zone === 'A' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'} />
              ))}
            </Bar>
          </BarChart>
        </Frame>
      ) : null}
      <Group gap={6}>
        <Button size="xs" variant={zone === 'A' ? 'filled' : 'default'} onClick={() => onZone('A')}>Зона A</Button>
        <Button size="xs" variant={zone === 'B' ? 'filled' : 'default'} onClick={() => onZone('B')}>Зона B</Button>
        <Select
          size="xs"
          value={slot ? `${slot.tour}.${slot.mini}` : null}
          data={story.slots.map((item) => ({ value: `${item.tour}.${item.mini}`, label: `${item.tour}.${item.mini}` }))}
          onChange={(value) => { if (value) onSlot(value) }}
        />
      </Group>
      <Frame title={`Секторы зоны ${zone}${slot ? ` · ${slot.tour}.${slot.mini}` : ''}`}>
        <BarChart data={cells}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="sector" tick={tick} />
          <YAxis tick={tick} width={40} />
          <Tooltip {...tipStyle} />
          <Bar dataKey="grams" name="Вес" fill={zone === 'A' ? 'var(--pc-zone-a)' : 'var(--pc-zone-b)'} />
        </BarChart>
      </Frame>
    </Stack>
  )
}

function TeamsPane({ weighed, entryId, onTeam }: { weighed: boolean; entryId: string | null; onTeam: (id: string) => void }) {
  const { story } = useV2Tournament()
  if (!weighed) return <EmptyState title="Весов ещё нет" />
  const cloud = weightPlacePoints(story)
  const compare = placeCompare(story)
  const share = weightShare(story)
  const radar = entryId ? radarAxes(story, entryId) : []
  const name = story.standings.find((row) => row.entryId === entryId)?.teamName
  const gaps = gramGaps(story)
  const mineGap = gaps.find((row) => row.entryId === entryId)
  const byWeight = gaps.filter((row) => row.kind === 'weight' && row.grams > 0).slice(0, 10)
  return (
    <Stack gap="sm">
      {mineGap ? (
        <Panel p="sm">
          <Text size="xs" c="dimmed" tt="uppercase">До места выше</Text>
          <Text fw={700}>{gapSentence(mineGap)}</Text>
        </Panel>
      ) : null}
      {byWeight.length > 0 ? (
        <Frame title="Кого развёл вес" note="Сумма мест одинаковая. Столбец — сколько грамм не хватило до команды выше." height={Math.max(220, byWeight.length * 36)}>
          <BarChart data={byWeight} layout="vertical" onClick={(state) => {
            const id = (state as { activePayload?: { payload?: { entryId?: string } }[] } | null)?.activePayload?.[0]?.payload?.entryId
            if (id) onTeam(id)
          }}>
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis type="number" tick={tick} />
            <YAxis type="category" dataKey="name" tick={tick} width={120} />
            <Tooltip {...tipStyle} />
            <Bar dataKey="grams" name="Не хватило, г" fill="var(--pc-signal)" />
          </BarChart>
        </Frame>
      ) : (
        <Panel p="sm">
          <Text size="sm" c="dimmed">Вес никого из соседей не развёл: у каждой пары разная сумма мест.</Text>
        </Panel>
      )}
      <Frame title="Вес и сумма мест" note="Нажатие на точку выбирает команду. Ниже точка — лучше сумма.">
        <ScatterChart onClick={(state) => {
          const id = (state as { activePayload?: { payload?: { entryId?: string } }[] } | null)?.activePayload?.[0]?.payload?.entryId
          if (id) onTeam(id)
        }}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="weight" name="Вес" tick={tick} />
          <YAxis dataKey="placeSum" name="Сумма" tick={tick} width={32} />
          <Tooltip {...tipStyle} />
          <Scatter data={cloud} fill="var(--pc-signal)" />
        </ScatterChart>
      </Frame>
      <Frame title="Место и место по весу" height={Math.max(280, compare.length * 26)}>
        <BarChart data={compare} layout="vertical">
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis type="number" tick={tick} />
          <YAxis type="category" dataKey="name" tick={tick} width={120} />
          <Tooltip {...tipStyle} />
          <Legend />
          <Bar dataKey="place" name="Место" fill="var(--pc-signal)" />
          <Bar dataKey="byWeight" name="Если по весу" fill="var(--pc-zone-a)" />
        </BarChart>
      </Frame>
      <Frame title="Доля улова" height={320}>
        <Treemap data={share} dataKey="size" nameKey="name" stroke="var(--pc-bg)" fill="var(--pc-signal)" aspectRatio={4 / 3}>
          {share.map((item) => (
            <Cell key={item.entryId} fill={`color-mix(in srgb, var(--pc-signal) ${Math.max(28, 100 - (item.place - 1) * 6)}%, var(--pc-panel))`} />
          ))}
        </Treemap>
      </Frame>
      {radar.length > 0 ? (
        <Frame title={`Профиль · ${name ?? ''}`} note="100 — лучший слот дня, ровный вес, ровные берега и ни одного нуля.">
          <RadarChart data={radar}>
            <PolarGrid stroke="var(--pc-line)" />
            <PolarAngleAxis dataKey="axis" tick={tick} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} />
            <Radar dataKey="value" stroke="var(--pc-signal)" fill="var(--pc-signal)" fillOpacity={0.35} />
          </RadarChart>
        </Frame>
      ) : null}
    </Stack>
  )
}

function SeasonPane({ loading, bundles }: { loading: boolean; bundles: SeasonBundle[] }) {
  const { story, tournament } = useV2Tournament()
  const focus = useMemo(() => {
    const seen = new Set<string>()
    const pairs: { key: string; label: string }[] = []
    for (const row of [...story.standings].sort((a, b) => a.finalPlace - b.finalPlace)) {
      const key = pairKey(row.rosterNames)
      if (!key || seen.has(key)) continue
      seen.add(key)
      pairs.push({ key, label: row.teamName })
    }
    return pairs
  }, [story.standings])
  const linesFocus = focus.slice(0, 6)
  const [pair, setPair] = useState<string | null>(null)
  const pairKeySelected = pair ?? focus[0]?.key ?? null
  if (loading && bundles.length === 0) return <Text c="dimmed">Считаем сезон…</Text>
  if (bundles.length === 0) return <EmptyState title="Сезону пока не из чего сложиться" />
  const lines = seasonPlaceSeries(bundles, linesFocus.map((item) => item.key))
  const stats = seasonPairStats(bundles).slice(0, 12)
  const decision = shoreDecision(bundles)
  const points = pairKeySelected ? seasonSectorPoints(bundles, pairKeySelected) : []
  const pulse = cupAgainst(bundles, tournament.id)
  const roster = story.standings.find((row) => pairKey(row.rosterNames) === pairKeySelected)?.rosterNames ?? []
  const rivals = roster.length ? rivalsForNames(bundles, roster).slice(0, 8) : []
  return (
    <Stack gap="sm">
      {pulse ? (
        <Group grow align="stretch">
          <Panel p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Вес дня</Text>
            <Text fw={700}>{(pulse.mine.total / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} кг</Text>
            <Text size="sm" c="dimmed">{pulse.past ? `Прошлые старты в среднем ${(pulse.past.total / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} кг` : 'Других стартов в сезоне нет'}</Text>
          </Panel>
          <Panel p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Средний вес окна</Text>
            <Text fw={700}>{pulse.mine.avg.toLocaleString('ru-RU')} г</Text>
            <Text size="sm" c="dimmed">{pulse.past ? `Прошлые старты в среднем ${pulse.past.avg.toLocaleString('ru-RU')} г` : 'Других стартов в сезоне нет'}</Text>
          </Panel>
          <Panel p="sm">
            <Text size="xs" c="dimmed" tt="uppercase">Нули</Text>
            <Text fw={700}>{pulse.mine.zeros}</Text>
            <Text size="sm" c="dimmed">{pulse.past ? `Прошлые старты в среднем ${pulse.past.zeros}` : 'Других стартов в сезоне нет'}</Text>
          </Panel>
        </Group>
      ) : null}
      <Frame title="Место пар по стартам" note="Линии — первые пары этого турнира. Выше линия — лучше место." height={320}>
        <LineChart data={lines}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="label" tick={tick} />
          <YAxis tick={tick} width={28} reversed />
          <Tooltip {...tipStyle} />
          <Legend />
          {linesFocus.map((item, index) => (
            <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} stroke={chartColors[index % chartColors.length]} connectNulls dot />
          ))}
        </LineChart>
      </Frame>
      <Frame title="Старты, подиумы, победы" height={Math.max(280, stats.length * 32)}>
        <BarChart data={stats} layout="vertical">
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis type="number" tick={tick} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={tick} width={120} />
          <Tooltip {...tipStyle} />
          <Legend />
          <Bar dataKey="starts" name="Старты" fill="var(--pc-zone-a)" />
          <Bar dataKey="podiums" name="Подиумы" fill="var(--pc-signal)" />
          <Bar dataKey="wins" name="Победы" fill="var(--pc-zone-b)" />
        </BarChart>
      </Frame>
      <Frame title="Какой берег лучше по месту" height={220}>
        <BarChart data={decision}>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="name" tick={tick} />
          <YAxis tick={tick} width={32} allowDecimals={false} />
          <Tooltip {...tipStyle} />
          <Bar dataKey="value" name="Старты" fill="var(--pc-signal)" />
        </BarChart>
      </Frame>
      <Select
        placeholder="Пара"
        value={pairKeySelected}
        data={focus.map((item) => ({ value: item.key, label: item.label }))}
        onChange={setPair}
        searchable
      />
      {rivals.length > 0 ? (
        <Frame title="Соперники стартовой группы" note="Сколько раз пары стояли в одной группе и кто финишировал выше." height={Math.max(240, rivals.length * 36)}>
          <BarChart data={rivals} layout="vertical">
            <CartesianGrid stroke="var(--pc-line)" />
            <XAxis type="number" tick={tick} allowDecimals={false} />
            <YAxis type="category" dataKey="teamName" tick={tick} width={120} />
            <Tooltip {...tipStyle} />
            <Legend />
            <Bar dataKey="myBetter" name="Выше мы" fill="var(--pc-signal)" />
            <Bar dataKey="theirBetter" name="Выше они" fill="var(--pc-zone-a)" />
          </BarChart>
        </Frame>
      ) : (
        <Panel p="sm">
          <Text size="sm" c="dimmed">В одной стартовой группе с этой парой больше никто не пересекался.</Text>
        </Panel>
      )}
      <Frame title="Сектор и вес за сезоны">
        <ScatterChart>
          <CartesianGrid stroke="var(--pc-line)" />
          <XAxis dataKey="sector" name="Сектор" tick={tick} />
          <YAxis dataKey="grams" name="Вес" tick={tick} width={40} />
          <Tooltip {...tipStyle} />
          <Scatter data={points} fill="var(--pc-zone-b)" />
        </ScatterChart>
      </Frame>
    </Stack>
  )
}
