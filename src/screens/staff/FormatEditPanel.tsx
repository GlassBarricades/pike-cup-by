import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Checkbox, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTournamentFormat } from '../../features/tournament/api'
import {
  BOOR_INDIVIDUAL_TEAM_FORMAT,
  FORMAT_PRESETS,
  PIKECUP_FORMAT,
  type TournamentFormat,
} from '../../features/tournament/formats'
import { invalidateTournamentCard, invalidateTournamentLists, useCatches } from '../../features/tournament/hooks'
import type { Tournament } from '../../features/tournament/types'
import { Panel, SectionTitle } from '../../ui'

function cloneFormat(format: TournamentFormat): TournamentFormat {
  return structuredClone(format)
}

function matchPresetId(format: TournamentFormat): string {
  const found = FORMAT_PRESETS.find((p) => JSON.stringify(p.format) === JSON.stringify(format))
  return found?.id ?? 'custom'
}

export function FormatEditPanel({ tournament }: { tournament: Tournament }) {
  const queryClient = useQueryClient()
  const { data: catches = [] } = useCatches(tournament.id)
  const locked = catches.length > 0
  const [draft, setDraft] = useState<TournamentFormat>(() => cloneFormat(tournament.format))
  const [preset, setPreset] = useState(matchPresetId(tournament.format))

  useEffect(() => {
    setDraft(cloneFormat(tournament.format))
    setPreset(matchPresetId(tournament.format))
  }, [tournament.id, tournament.format])

  const tour1Minis = draft.tours.find((t) => t.number === 1)?.minis ?? 3
  const tour2Minis = draft.tours.find((t) => t.number === 2)?.minis ?? 3

  const summary = useMemo(() => {
    const tours = draft.tours.map((t) => `${t.number}×${t.minis}`).join(', ')
    return `${draft.engine} · туры ${tours} · зоны ${draft.zones.join('/')} · состав ${draft.roster.minAthletes}–${draft.roster.maxAthletes}`
  }, [draft])

  const saveMutation = useMutation({
    mutationFn: () => updateTournamentFormat(tournament.id, draft),
    onSuccess: async () => {
      await invalidateTournamentLists(queryClient)
      await invalidateTournamentCard(queryClient, tournament.id)
    },
  })

  const applyPreset = (id: string) => {
    setPreset(id)
    if (id === 'pikecup') setDraft(cloneFormat(PIKECUP_FORMAT))
    if (id === 'boor_individual') setDraft(cloneFormat(BOOR_INDIVIDUAL_TEAM_FORMAT))
  }

  const setTourMinis = (tourNumber: number, minis: number) => {
    setPreset('custom')
    setDraft((prev) => ({
      ...prev,
      tours: prev.tours.map((t) => (t.number === tourNumber ? { ...t, minis } : t)),
    }))
  }

  return (
    <Panel>
      <Stack gap="md">
        <SectionTitle>Формат соревнования</SectionTitle>
        <Text size="sm" c="dimmed">
          {summary}
        </Text>
        {locked && (
          <Alert color="yellow" title="Формат заблокирован">
            Уже есть уловы. Чтобы менять формат, удалите уловы этого турнира.
          </Alert>
        )}
        <Select
          label="Пресет"
          data={[
            ...FORMAT_PRESETS.map((p) => ({ value: p.id, label: p.label })),
            { value: 'custom', label: 'Свой' },
          ]}
          value={preset}
          onChange={(v) => v && applyPreset(v)}
          disabled={locked}
        />
        <Select
          label="Движок"
          data={[
            { value: 'pikecup', label: 'PikeCup (командный, бумажки)' },
            { value: 'individual', label: 'Индивидуально-командный' },
          ]}
          value={draft.engine}
          onChange={(v) => {
            if (!v) return
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              engine: v as TournamentFormat['engine'],
              draw: v === 'pikecup' ? 'pikecup_slips' : 'per_athlete_sectors',
              standings: v === 'pikecup' ? ['team'] : ['team', 'individual'],
            }))
          }}
          disabled={locked}
        />
        <NumberInput
          label="Мини-туров в I туре"
          min={1}
          max={20}
          value={tour1Minis}
          onChange={(v) => setTourMinis(1, Number(v) || 1)}
          disabled={locked}
        />
        <NumberInput
          label="Мини-туров во II туре"
          min={1}
          max={20}
          value={tour2Minis}
          onChange={(v) => setTourMinis(2, Number(v) || 1)}
          disabled={locked}
        />
        <TextInput
          label="Зоны (через запятую)"
          value={draft.zones.join(',')}
          onChange={(e) => {
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              zones: e.currentTarget.value
                .split(',')
                .map((z) => z.trim())
                .filter(Boolean),
            }))
          }}
          disabled={locked}
        />
        <NumberInput
          label="Мин. спортсменов"
          min={1}
          max={10}
          value={draft.roster.minAthletes}
          onChange={(v) => {
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              roster: { ...prev.roster, minAthletes: Number(v) || 1 },
            }))
          }}
          disabled={locked}
        />
        <NumberInput
          label="Макс. спортсменов"
          min={1}
          max={10}
          value={draft.roster.maxAthletes}
          onChange={(v) => {
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              roster: { ...prev.roster, maxAthletes: Number(v) || 1 },
            }))
          }}
          disabled={locked}
        />
        <Checkbox
          label="Капитан в заявке"
          checked={draft.roster.captain}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              roster: { ...prev.roster, captain: checked },
            }))
          }}
          disabled={locked}
        />
        <Checkbox
          label="Представитель в заявке"
          checked={draft.roster.representative}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              roster: { ...prev.roster, representative: checked },
            }))
          }}
          disabled={locked}
        />
        <Select
          label="Группа ранжирования"
          data={[
            { value: 'zone_tour', label: 'Зона × тур' },
            { value: 'tour', label: 'Весь тур' },
          ]}
          value={draft.ranking.group}
          onChange={(v) => {
            if (!v) return
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              ranking: { ...prev.ranking, group: v as TournamentFormat['ranking']['group'] },
            }))
          }}
          disabled={locked}
        />
        <Select
          label="Место при нулевом улове"
          data={[
            { value: 'group_size_plus_one', label: 'n + 1' },
            { value: 'group_size', label: 'n' },
          ]}
          value={draft.ranking.zeroPlace}
          onChange={(v) => {
            if (!v) return
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              ranking: { ...prev.ranking, zeroPlace: v as TournamentFormat['ranking']['zeroPlace'] },
            }))
          }}
          disabled={locked}
        />
        <Checkbox
          label="Отдельный зачёт юниоров"
          description="Две личные таблицы: общий (без юниоров) и юниоры. Командный общий."
          checked={Boolean(draft.ranking.separateJuniors)}
          onChange={(e) => {
            const checked = e.currentTarget.checked
            setPreset('custom')
            setDraft((prev) => ({
              ...prev,
              ranking: { ...prev.ranking, separateJuniors: checked },
            }))
          }}
          disabled={locked || draft.engine !== 'individual'}
        />
        <Select
          label="Жеребьёвка"
          data={[
            { value: 'pikecup_slips', label: 'Бумажки PikeCup' },
            { value: 'per_athlete_sectors', label: 'Секторы спортсменов' },
            { value: 'none', label: 'Без жеребьёвки' },
          ]}
          value={draft.draw}
          onChange={(v) => {
            if (!v) return
            setPreset('custom')
            setDraft((prev) => ({ ...prev, draw: v as TournamentFormat['draw'] }))
          }}
          disabled={locked}
        />
        <Button color="signal" loading={saveMutation.isPending} disabled={locked} onClick={() => saveMutation.mutate()}>
          Сохранить формат
        </Button>
        {saveMutation.isSuccess && (
          <Text size="sm" c="dimmed">
            Сохранено
          </Text>
        )}
        {saveMutation.isError && (
          <Text size="sm" c="red">
            {(saveMutation.error as Error).message}
          </Text>
        )}
      </Stack>
    </Panel>
  )
}
