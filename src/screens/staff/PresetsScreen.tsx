import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Code,
  Collapse,
  Group,
  Stack,
  Text,
} from '@mantine/core'
import {
  useDuplicateFormatPreset,
  useFormatPresets,
  useUpdateFormatPreset,
} from '../../features/formatPresets'
import { formatSummary } from '../../features/tournament/formats'
import { EmptyState, PageHeader, Panel, SectionTitle } from '../../ui'

export function PresetsScreen() {
  const navigate = useNavigate()
  const { data: presets = [], isLoading, isError, error } = useFormatPresets()
  const duplicateMutation = useDuplicateFormatPreset()
  const updateMutation = useUpdateFormatPreset()
  const [jsonOpenId, setJsonOpenId] = useState<string | null>(null)

  const sorted = useMemo(
    () =>
      [...presets].sort((a, b) => {
        if (a.is_system !== b.is_system) return a.is_system ? -1 : 1
        return a.name.localeCompare(b.name, 'ru')
      }),
    [presets],
  )

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <div>
          <PageHeader title="Пресеты форматов" />
          <Text size="sm" c="dimmed" mt={4}>
            Библиотека форматов для турниров и лиг. Создавайте и правите без турнира.
          </Text>
        </div>
        <Button component={Link} to="/staff/presets/new" color="signal">
          Создать пресет
        </Button>
      </Group>

      {isLoading && (
        <Text size="sm" c="dimmed">
          Загрузка…
        </Text>
      )}
      {isError && (
        <Text size="sm" c="red">
          {(error as Error).message}
        </Text>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <EmptyState
          title="Пресетов пока нет"
          description="Нажмите «Создать пресет» — можно начать от PikeCup или Кордона."
        />
      )}

      {sorted.map((preset) => {
        const jsonOpen = jsonOpenId === preset.id
        return (
          <Panel key={preset.id}>
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                <div>
                  <Group gap="xs" mb={4}>
                    <SectionTitle>{preset.name}</SectionTitle>
                    {preset.is_system && (
                      <Badge size="sm" variant="light" color="gray">
                        системный
                      </Badge>
                    )}
                  </Group>
                  {preset.description ? (
                    <Text size="sm" c="dimmed">
                      {preset.description}
                    </Text>
                  ) : null}
                  <Text size="sm" mt={4}>
                    {formatSummary(preset.format)}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {preset.slug}
                  </Text>
                </div>
                <Group gap="xs">
                  <Button
                    component={Link}
                    to={`/staff/presets/${preset.id}`}
                    size="xs"
                    color="signal"
                    variant="light"
                  >
                    Открыть
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    loading={duplicateMutation.isPending && duplicateMutation.variables?.id === preset.id}
                    onClick={() =>
                      duplicateMutation.mutate(
                        { id: preset.id },
                        {
                          onSuccess: (created) => navigate(`/staff/presets/${created.id}`),
                        },
                      )
                    }
                  >
                    Дублировать
                  </Button>
                  {!preset.is_system && (
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      loading={
                        updateMutation.isPending &&
                        updateMutation.variables?.id === preset.id &&
                        updateMutation.variables.patch.archive === true
                      }
                      onClick={() => updateMutation.mutate({ id: preset.id, patch: { archive: true } })}
                    >
                      Архив
                    </Button>
                  )}
                </Group>
              </Group>

              <Button
                size="xs"
                variant="subtle"
                color="gray"
                w="fit-content"
                onClick={() => setJsonOpenId(jsonOpen ? null : preset.id)}
              >
                {jsonOpen ? 'Скрыть JSON' : 'Показать JSON'}
              </Button>
              <Collapse expanded={jsonOpen}>
                <Code block style={{ maxHeight: 280, overflow: 'auto', fontSize: 11 }}>
                  {JSON.stringify(preset.format, null, 2)}
                </Code>
              </Collapse>
            </Stack>
          </Panel>
        )
      })}
    </Stack>
  )
}
