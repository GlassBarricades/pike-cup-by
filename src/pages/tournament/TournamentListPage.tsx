import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { EditTournamentModal } from '../../components/EditTournamentModal'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { createTournament } from '../../features/tournament/api'
import { formatTournamentDate, statusLabel } from '../../features/tournament/date'
import { tournamentKeys, useCurrentAndArchive, useTournaments } from '../../features/tournament/hooks'
import type { Tournament, TournamentStatus } from '../../features/tournament/types'

export function TournamentListPage() {
  const { current, archive, isLoading } = useCurrentAndArchive()
  const { data: tournaments = [] } = useTournaments()
  const { role } = useAuth()
  const canManage = canManageTournament(role)
  const [createOpened, setCreateOpened] = useState(false)
  const [editing, setEditing] = useState<Tournament | null>(null)

  return (
    <Stack gap="lg" maw={640} mx="auto">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Турниры</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Актуальный этап и архив прошедших Pike Cup
          </Text>
        </div>
        {canManage && (
          <Button
            color="depth"
            leftSection={<IconPlus size={18} />}
            onClick={() => setCreateOpened(true)}
          >
            Создать
          </Button>
        )}
      </Group>

      {isLoading && <Text c="dimmed">Загрузка…</Text>}

      {!isLoading && !current && archive.length === 0 && (
        <Stack gap="sm">
          <Text c="dimmed" size="sm">
            Турниров пока нет.
          </Text>
          {canManage && (
            <Button color="depth" variant="light" onClick={() => setCreateOpened(true)}>
              Создать первый турнир
            </Button>
          )}
        </Stack>
      )}

      {current && (
        <Stack gap="xs">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">
            Сейчас
          </Text>
          <TournamentCard
            tournament={current}
            featured
            canEdit={canManage}
            onEdit={() => setEditing(current)}
          />
        </Stack>
      )}

      <Stack gap="xs">
        <Text fw={700} size="sm" c="dimmed" tt="uppercase">
          Архив
        </Text>
        {archive.length === 0 && !isLoading && (current || !canManage) && (
          <Text c="dimmed" size="sm">
            Архивных турниров пока нет.
          </Text>
        )}
        {archive.map((t) => (
          <TournamentCard
            key={t.id}
            tournament={t}
            canEdit={canManage}
            onEdit={() => setEditing(t)}
          />
        ))}
      </Stack>

      <CreateTournamentModal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        existingRules={tournaments.find((t) => t.rules_content?.length > 40)?.rules_content}
      />
      <EditTournamentModal
        tournament={editing}
        opened={Boolean(editing)}
        onClose={() => setEditing(null)}
      />
    </Stack>
  )
}

function CreateTournamentModal({
  opened,
  onClose,
  existingRules,
}: {
  opened: boolean
  onClose: () => void
  existingRules?: string
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('Pike Cup in Belarus')
  const [location, setLocation] = useState('озеро Повстынь')
  const [eventDate, setEventDate] = useState('')
  const [status, setStatus] = useState<TournamentStatus>('finished')
  const [organizers, setOrganizers] = useState('Артемчик Евгений, Зубко Сергей')
  const [withSchedule, setWithSchedule] = useState(true)
  const [copyRules, setCopyRules] = useState(true)

  const mutation = useMutation({
    mutationFn: () =>
      createTournament({
        name,
        eventDate,
        location,
        status,
        organizers: organizers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        rulesContent: copyRules ? existingRules : undefined,
        withDefaultSchedule: withSchedule,
      }),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      onClose()
      navigate(`/tournament/${created.id}`)
    },
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Новый турнир" centered>
      <Stack gap="sm">
        <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput
          label="Дата"
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.currentTarget.value)}
        />
        <TextInput
          label="Место"
          value={location}
          onChange={(e) => setLocation(e.currentTarget.value)}
        />
        <TextInput
          label="Оргкомитет (через запятую)"
          value={organizers}
          onChange={(e) => setOrganizers(e.currentTarget.value)}
        />
        <Select
          label="Статус"
          data={[
            { value: 'finished', label: 'Завершён (архив)' },
            { value: 'published', label: 'Опубликован (актуальный)' },
            { value: 'live', label: 'Идёт' },
            { value: 'draft', label: 'Черновик' },
          ]}
          value={status}
          onChange={(v) => setStatus((v as TournamentStatus) ?? 'finished')}
        />
        <Checkbox
          label="Создать типовое расписание и мини-туры"
          checked={withSchedule}
          onChange={(e) => setWithSchedule(e.currentTarget.checked)}
        />
        <Checkbox
          label="Скопировать регламент с существующего турнира"
          checked={copyRules}
          onChange={(e) => setCopyRules(e.currentTarget.checked)}
          disabled={!existingRules}
        />
        {mutation.isError && (
          <Text c="red" size="sm">
            {(mutation.error as Error).message}
          </Text>
        )}
        <Button
          color="depth"
          fullWidth
          disabled={!name || !eventDate || !location}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Создать турнир
        </Button>
      </Stack>
    </Modal>
  )
}

function TournamentCard({
  tournament,
  featured,
  canEdit,
  onEdit,
}: {
  tournament: Tournament
  featured?: boolean
  canEdit?: boolean
  onEdit?: () => void
}) {
  return (
    <UnstyledButton
      component={Link}
      to={`/tournament/${tournament.id}`}
      p={featured ? 'lg' : 'sm'}
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        border: '1px solid var(--pc-hairline)',
        borderLeft: featured
          ? '3px solid var(--mantine-color-lure-5)'
          : '3px solid transparent',
        background: featured
          ? 'linear-gradient(120deg, color-mix(in srgb, var(--mantine-color-depth-5) 12%, var(--pc-surface)), var(--pc-surface))'
          : 'var(--pc-surface)',
        display: 'block',
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text fw={800} size={featured ? 'lg' : 'sm'}>
            {tournament.name}
          </Text>
          <Text size={featured ? 'sm' : 'xs'} c="dimmed">
            {formatTournamentDate(tournament.event_date)} · {tournament.location}
          </Text>
        </div>
        <Group gap="xs" wrap="nowrap">
          {canEdit && (
            <ActionIcon
              variant="subtle"
              color="depth"
              aria-label="Редактировать"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit?.()
              }}
            >
              <IconPencil size={16} />
            </ActionIcon>
          )}
          <Badge
            color={
              tournament.status === 'finished'
                ? 'gray'
                : tournament.status === 'live'
                  ? 'lure'
                  : 'depth'
            }
            variant="filled"
          >
            {statusLabel[tournament.status]}
          </Badge>
        </Group>
      </Group>
    </UnstyledButton>
  )
}
