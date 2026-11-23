import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  diffFormatPaths,
  useCreateFormatPreset,
  useFormatPresets,
  useUpdateFormatPreset,
} from '../../features/formatPresets'
import { updateTournamentFormat } from '../../features/tournament/api'
import {
  cloneFormat,
  FORMAT_PRESETS,
  formatSummary,
  type TournamentFormat,
} from '../../features/tournament/formats'
import { slugifyLeagueName } from '../../features/tournament/leagueLabels'
import { invalidateTournamentCard, invalidateTournamentLists, useCatches } from '../../features/tournament/hooks'
import type { Tournament } from '../../features/tournament/types'
import { Panel, SectionTitle } from '../../ui'
import { FormatSettingsFields } from './FormatSettingsFields'

const CUSTOM = 'custom'

export function FormatEditPanel({ tournament }: { tournament: Tournament }) {
  const queryClient = useQueryClient()
  const { data: catches = [] } = useCatches(tournament.id)
  const { data: dbPresets = [] } = useFormatPresets()
  const createPreset = useCreateFormatPreset()
  const updatePreset = useUpdateFormatPreset()
  const locked = catches.length > 0
  const [draft, setDraft] = useState<TournamentFormat>(() => cloneFormat(tournament.format))
  const [presetId, setPresetId] = useState<string>(tournament.format_preset_id ?? CUSTOM)
  const [showNewPreset, setShowNewPreset] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [newPresetSlug, setNewPresetSlug] = useState('')

  const presetOptions = useMemo(() => {
    if (dbPresets.length > 0) {
      return [
        ...dbPresets.map((p) => ({ value: p.id, label: p.name })),
        { value: CUSTOM, label: 'Свой' },
      ]
    }
    return [
      ...FORMAT_PRESETS.map((p) => ({ value: p.id, label: p.label })),
      { value: CUSTOM, label: 'Свой' },
    ]
  }, [dbPresets])

  const selectedDbPreset = useMemo(
    () => dbPresets.find((p) => p.id === presetId) ?? null,
    [dbPresets, presetId],
  )

  const selectedFormat = useMemo(() => {
    if (selectedDbPreset) return selectedDbPreset.format
    const code = FORMAT_PRESETS.find((p) => p.id === presetId)
    return code?.format ?? null
  }, [presetId, selectedDbPreset])

  const diffPaths = useMemo(() => {
    if (!selectedFormat || presetId === CUSTOM) return []
    return diffFormatPaths(draft, selectedFormat)
  }, [draft, selectedFormat, presetId])

  useEffect(() => {
    setDraft(cloneFormat(tournament.format))
    setPresetId(tournament.format_preset_id ?? CUSTOM)
  }, [tournament.id, tournament.format, tournament.format_preset_id])

  const summary = useMemo(() => formatSummary(draft), [draft])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTournamentFormat(tournament.id, draft, {
        formatPresetId:
          selectedDbPreset && diffPaths.length === 0 ? selectedDbPreset.id : null,
      }),
    onSuccess: async () => {
      await invalidateTournamentLists(queryClient)
      await invalidateTournamentCard(queryClient, tournament.id)
    },
  })

  const applyPreset = (id: string) => {
    setPresetId(id)
    if (id === CUSTOM) return
    const db = dbPresets.find((p) => p.id === id)
    if (db) {
      setDraft(cloneFormat(db.format))
      return
    }
    const code = FORMAT_PRESETS.find((p) => p.id === id)
    if (code) setDraft(cloneFormat(code.format))
  }

  const openNewPresetForm = () => {
    const base = `Формат ${tournament.name}`
    setNewPresetName(base)
    setNewPresetSlug(slugifyLeagueName(base) || `format-${Date.now().toString(36)}`)
    setShowNewPreset(true)
  }

  return (
    <Panel>
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <SectionTitle>Формат соревнования</SectionTitle>
          <Button component={Link} to="/staff/presets" size="xs" variant="light" color="gray">
            Библиотека пресетов
          </Button>
        </Group>
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
          data={presetOptions}
          value={presetId}
          onChange={(v) => v && applyPreset(v)}
          disabled={locked}
          searchable
        />
        {presetId !== CUSTOM && diffPaths.length > 0 && (
          <Alert color="yellow" title="Отличается от пресета">
            Черновик отличается от выбранного пресета ({diffPaths.length}{' '}
            {diffPaths.length === 1 ? 'поле' : 'полей'}).
          </Alert>
        )}
        <Group gap="xs" wrap="wrap">
          <Button size="xs" variant="light" color="gray" disabled={locked} onClick={openNewPresetForm}>
            Сохранить как новый пресет
          </Button>
          <Button
            size="xs"
            variant="light"
            color="gray"
            disabled={locked || !selectedDbPreset || selectedDbPreset.is_system}
            loading={updatePreset.isPending}
            onClick={() => {
              if (!selectedDbPreset) return
              updatePreset.mutate({
                id: selectedDbPreset.id,
                patch: { format: draft },
              })
            }}
          >
            Обновить пресет
          </Button>
        </Group>
        {showNewPreset && (
          <Stack gap="xs">
            <TextInput
              label="Название пресета"
              value={newPresetName}
              onChange={(e) => {
                const next = e.currentTarget.value
                setNewPresetName(next)
                if (!newPresetSlug || newPresetSlug === slugifyLeagueName(newPresetName)) {
                  setNewPresetSlug(slugifyLeagueName(next) || `format-${Date.now().toString(36)}`)
                }
              }}
            />
            <TextInput
              label="Slug"
              value={newPresetSlug}
              onChange={(e) => setNewPresetSlug(e.currentTarget.value.toLowerCase())}
            />
            {createPreset.isError && (
              <Text size="sm" c="red">
                {(createPreset.error as Error).message}
              </Text>
            )}
            <Group gap="xs">
              <Button
                size="xs"
                color="signal"
                disabled={!newPresetName.trim() || !newPresetSlug.trim()}
                loading={createPreset.isPending}
                onClick={() => {
                  createPreset.mutate(
                    {
                      name: newPresetName.trim(),
                      slug: newPresetSlug.trim(),
                      format: draft,
                    },
                    {
                      onSuccess: (created) => {
                        setPresetId(created.id)
                        setShowNewPreset(false)
                      },
                    },
                  )
                }}
              >
                Создать пресет
              </Button>
              <Button size="xs" variant="subtle" color="gray" onClick={() => setShowNewPreset(false)}>
                Отмена
              </Button>
            </Group>
          </Stack>
        )}
        {updatePreset.isError && (
          <Text size="sm" c="red">
            {(updatePreset.error as Error).message}
          </Text>
        )}

        <FormatSettingsFields
          value={draft}
          onChange={setDraft}
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
