import { useEffect, useState } from 'react'
import {
  Anchor,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { ScoreSurface, SectionHead } from '../../components/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { deleteAthlete, updateAthlete } from '../../features/tournament/api'
import { formatTournamentDate } from '../../features/tournament/date'
import {
  tournamentKeys,
  useAthlete,
  useAthleteHistory,
  useAthleteTournaments,
  useAthletesCatalog,
} from '../../features/tournament/hooks'

export function AthleteDetailPage() {
  const { athleteId } = useParams()
  const { data: athlete, isLoading } = useAthlete(athleteId)
  const { data: catalog = [] } = useAthletesCatalog()
  const { data: history = [] } = useAthleteHistory(athleteId)
  const { data: appearances = [] } = useAthleteTournaments(athleteId)
  const { role } = useAuth()
  const canEdit = canManageTournament(role)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const withTeam = catalog.find((a) => a.id === athleteId)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (!athlete) return
    setFullName(athlete.full_name)
    setPhone(athlete.phone ?? '')
  }, [athlete])

  const saveMutation = useMutation({
    mutationFn: () => updateAthlete(athleteId!, { fullName, phone }),
    onSuccess: async () => {
      setEditing(false)
      await queryClient.invalidateQueries({ queryKey: ['athlete', athleteId] })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAthlete(athleteId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
      navigate('/athletes')
    },
  })

  if (isLoading) return <Text c="dimmed">Загрузка…</Text>
  if (!athlete) {
    return (
      <Stack gap="sm">
        <Text>Рыбак не найден</Text>
        <Anchor component={Link} to="/athletes" c="depth">
          К списку
        </Anchor>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Anchor component={Link} to="/athletes" size="sm" c="dimmed" hiddenFrom="md">
        ← Все рыбаки
      </Anchor>

      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{athlete.full_name}</Title>
          {withTeam?.current_team_name ? (
            <Text mt={4}>
              Команда:{' '}
              <Anchor component={Link} to={`/teams/${withTeam.current_team_id}`} c="depth">
                {withTeam.current_team_name}
              </Anchor>
            </Text>
          ) : (
            <Badge mt={8} color="gray" variant="light">
              Сейчас без команды
            </Badge>
          )}
          {athlete.phone && (
            <Text size="sm" c="dimmed" mt={4}>
              {athlete.phone}
            </Text>
          )}
        </div>
        {canEdit && !editing && (
          <Group gap="xs">
            <Button variant="light" color="depth" onClick={() => setEditing(true)}>
              Изменить
            </Button>
            <Button
              variant="light"
              color="red"
              loading={deleteMutation.isPending}
              onClick={() => {
                const teamNote = withTeam?.current_team_name
                  ? ` Он будет убран из команды «${withTeam.current_team_name}».`
                  : ''
                if (
                  !window.confirm(
                    `Удалить рыбака «${athlete.full_name}»?${teamNote} Снимки в протоколах турниров сохранятся.`,
                  )
                ) {
                  return
                }
                deleteMutation.mutate()
              }}
            >
              Удалить
            </Button>
          </Group>
        )}
      </Group>
      {deleteMutation.isError && (
        <Text c="red" size="sm">
          {(deleteMutation.error as Error).message}
        </Text>
      )}

      {editing && (
        <ScoreSurface p="md">
          <Stack gap="sm">
            <TextInput label="ФИО" value={fullName} onChange={(e) => setFullName(e.currentTarget.value)} />
            <TextInput label="Телефон" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} />
            <Group>
              <Button
                color="depth"
                loading={saveMutation.isPending}
                disabled={!fullName.trim()}
                onClick={() => saveMutation.mutate()}
              >
                Сохранить
              </Button>
              <Button variant="subtle" onClick={() => setEditing(false)}>
                Отмена
              </Button>
            </Group>
          </Stack>
        </ScoreSurface>
      )}

      <Stack gap="xs">
        <SectionHead title="История команд" order={4} />
        {history.length === 0 && <Text c="dimmed" size="sm">Пока нет записей</Text>}
        {history.map((m) => (
          <Group
            key={m.id}
            justify="space-between"
            wrap="nowrap"
            py={6}
            style={{ borderBottom: '1px solid var(--pc-hairline)' }}
          >
            <Anchor component={Link} to={`/teams/${m.team_id}`} size="sm" c="depth">
              {m.team?.name ?? 'Команда'}
            </Anchor>
            <Text size="xs" c="dimmed">
              {formatShort(m.started_at)}
              {m.ended_at ? ` — ${formatShort(m.ended_at)}` : ' — сейчас'}
            </Text>
          </Group>
        ))}
      </Stack>

      <Stack gap="xs">
        <SectionHead title="Турниры" order={4} />
        {appearances.length === 0 && (
          <Text c="dimmed" size="sm">
            Нет участий в снимках турниров
          </Text>
        )}
        {appearances.map((a) => (
          <ScoreSurface key={`${a.entryId}-${a.tournament?.id}`} p="sm">
            {a.tournament ? (
              <Anchor component={Link} to={`/tournament/${a.tournament.id}`} fw={700} c="depth">
                {a.tournament.name}
              </Anchor>
            ) : (
              <Text fw={700}>Турнир</Text>
            )}
            <Text size="sm" c="dimmed">
              {a.tournament ? formatTournamentDate(a.tournament.event_date) : '—'} · {a.teamName}
            </Text>
            <Text size="xs" c="dimmed">
              В протоколе: {a.fullNameSnapshot}
            </Text>
          </ScoreSurface>
        ))}
      </Stack>

      {canEdit && withTeam?.current_team_id && (
        <Button component={Link} to={`/teams/${withTeam.current_team_id}`} variant="light" color="depth">
          Управление составом команды
        </Button>
      )}
    </Stack>
  )
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU')
}
