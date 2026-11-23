import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, Button, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageRoles } from '../../features/auth/permissions'
import {
  useCreateFormatPreset,
  useDuplicateFormatPreset,
  useFormatPreset,
  useFormatPresets,
  useUpdateFormatPreset,
} from '../../features/formatPresets'
import {
  BOOR_INDIVIDUAL_TEAM_FORMAT,
  cloneFormat,
  FORMAT_PRESETS,
  formatSummary,
  PIKECUP_FORMAT,
  parseFormatStrict,
  type TournamentFormat,
} from '../../features/tournament/formats'
import { slugifyLeagueName } from '../../features/tournament/leagueLabels'
import { PageHeader, Panel, SectionTitle } from '../../ui'
import { FormatSettingsFields } from './FormatSettingsFields'

const TEMPLATE_OPTIONS = [
  { value: 'pikecup', label: 'От PikeCup' },
  { value: 'boor_individual', label: 'От Западного Кордона (БООР)' },
  { value: 'blank', label: 'От пустого (как Кордон)' },
]

function templateFormat(id: string): TournamentFormat {
  if (id === 'pikecup') return cloneFormat(PIKECUP_FORMAT)
  if (id === 'boor_individual') return cloneFormat(BOOR_INDIVIDUAL_TEAM_FORMAT)
  const code = FORMAT_PRESETS.find((p) => p.id === id)
  return cloneFormat(code?.format ?? BOOR_INDIVIDUAL_TEAM_FORMAT)
}

export function PresetEditorScreen() {
  const { presetId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = !presetId || presetId === 'new'
  const fromParam = searchParams.get('from')

  const { role } = useAuth()
  const isAdmin = canManageRoles(role)
  const existingQuery = useFormatPreset(isNew ? undefined : presetId)
  const { data: allPresets = [] } = useFormatPresets()
  const createMutation = useCreateFormatPreset()
  const updateMutation = useUpdateFormatPreset()
  const duplicateMutation = useDuplicateFormatPreset()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [draft, setDraft] = useState<TournamentFormat>(() =>
    templateFormat(fromParam ?? 'boor_individual'),
  )
  const [templateId, setTemplateId] = useState(fromParam ?? 'boor_individual')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(isNew)

  useEffect(() => {
    if (isNew || !existingQuery.data) return
    const preset = existingQuery.data
    setName(preset.name)
    setSlug(preset.slug)
    setDescription(preset.description)
    setDraft(cloneFormat(preset.format))
    setHydrated(true)
  }, [isNew, existingQuery.data])

  const isSystem = Boolean(existingQuery.data?.is_system)
  /** System presets: only admin can write; others should duplicate. */
  const readOnlySystem = isSystem && !isAdmin
  const summary = useMemo(() => formatSummary(draft), [draft])

  const templateSelectData = useMemo(() => {
    const db = allPresets.map((p) => ({ value: `db:${p.id}`, label: `От «${p.name}»` }))
    return [...TEMPLATE_OPTIONS, ...db]
  }, [allPresets])

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    if (id.startsWith('db:')) {
      const found = allPresets.find((p) => p.id === id.slice(3))
      if (found) setDraft(cloneFormat(found.format))
      return
    }
    setDraft(templateFormat(id))
  }

  const save = () => {
    setValidationError(null)
    if (!name.trim() || !slug.trim()) {
      setValidationError('Укажите название и slug')
      return
    }
    try {
      parseFormatStrict(draft)
    } catch (e) {
      setValidationError(e instanceof Error ? e.message : String(e))
      return
    }

    if (isNew) {
      createMutation.mutate(
        {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          format: draft,
        },
        {
          onSuccess: (created) => navigate(`/staff/presets/${created.id}`, { replace: true }),
        },
      )
      return
    }

    updateMutation.mutate(
      {
        id: presetId!,
        patch: {
          name: name.trim(),
          description: description.trim(),
          format: draft,
          ...(isSystem ? {} : { slug: slug.trim() }),
        },
      },
      {
        onSuccess: () => navigate('/staff/presets'),
      },
    )
  }

  if (!isNew && existingQuery.isLoading) {
    return (
      <Text size="sm" c="dimmed">
        Загрузка пресета…
      </Text>
    )
  }

  if (!isNew && existingQuery.isError) {
    return (
      <Stack gap="md">
        <Text c="red" size="sm">
          {(existingQuery.error as Error).message}
        </Text>
        <Button component={Link} to="/staff/presets" variant="light" color="gray" w="fit-content">
          К списку
        </Button>
      </Stack>
    )
  }

  if (!isNew && !existingQuery.data && hydrated === false) {
    return null
  }

  if (!isNew && !existingQuery.data) {
    return (
      <Stack gap="md">
        <Text c="red" size="sm">
          Пресет не найден
        </Text>
        <Button component={Link} to="/staff/presets" variant="light" color="gray" w="fit-content">
          К списку
        </Button>
      </Stack>
    )
  }

  const pending = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error ?? updateMutation.error

  return (
    <Stack gap="lg">
      <div>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <div>
            <PageHeader title={isNew ? 'Новый пресет' : 'Редактирование пресета'} />
            <Text size="sm" c="dimmed" mt={4}>
              Настройки сохраняются в библиотеку и не привязаны к турниру.
            </Text>
          </div>
          <Button component={Link} to="/staff/presets" variant="light" color="gray">
            К списку
          </Button>
        </Group>
      </div>

      <Panel>
        <Stack gap="md">
          <SectionTitle>Карточка</SectionTitle>
          {readOnlySystem && (
            <Alert color="yellow" title="Системный пресет">
              Организатор не может менять системный пресет. Сделайте копию и правьте её.
              <Button
                mt="sm"
                size="xs"
                variant="light"
                color="gray"
                loading={duplicateMutation.isPending}
                onClick={() => {
                  if (!presetId) return
                  duplicateMutation.mutate(
                    { id: presetId },
                    {
                      onSuccess: (created) =>
                        navigate(`/staff/presets/${created.id}`, { replace: true }),
                    },
                  )
                }}
              >
                Дублировать и править
              </Button>
            </Alert>
          )}
          {isSystem && isAdmin && (
            <Alert color="blue" title="Системный пресет">
              Slug зафиксирован. Изменения повлияют на выбор по умолчанию для новых турниров.
            </Alert>
          )}
          <TextInput
            label="Название"
            value={name}
            onChange={(e) => {
              const next = e.currentTarget.value
              setName(next)
              if (isNew && (!slug || slug === slugifyLeagueName(name))) {
                setSlug(slugifyLeagueName(next) || `format-${Date.now().toString(36)}`)
              }
            }}
            disabled={readOnlySystem}
          />
          <TextInput
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value.toLowerCase())}
            disabled={isSystem || readOnlySystem}
            description="Латиница, уникальный идентификатор"
          />
          <Textarea
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            minRows={2}
            disabled={readOnlySystem}
          />
          {isNew && (
            <Select
              label="Стартовый шаблон"
              data={templateSelectData}
              value={templateId}
              onChange={(v) => v && applyTemplate(v)}
              searchable
            />
          )}
          <Text size="sm" c="dimmed">
            {summary}
          </Text>
        </Stack>
      </Panel>

      <Panel>
        <Stack gap="md">
          <SectionTitle>Настройки формата</SectionTitle>
          {hydrated || isNew ? (
            <FormatSettingsFields value={draft} onChange={setDraft} disabled={readOnlySystem} />
          ) : null}
        </Stack>
      </Panel>

      {(validationError || saveError) && (
        <Text size="sm" c="red">
          {validationError ?? (saveError as Error).message}
        </Text>
      )}

      <Group gap="sm">
        {!readOnlySystem && (
          <Button color="signal" loading={pending} onClick={save}>
            {isNew ? 'Создать пресет' : 'Сохранить пресет'}
          </Button>
        )}
        <Button component={Link} to="/staff/presets" variant="subtle" color="gray">
          {readOnlySystem ? 'Назад' : 'Отмена'}
        </Button>
      </Group>
    </Stack>
  )
}
