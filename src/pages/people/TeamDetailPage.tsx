import { useEffect, useMemo, useState } from 'react'
import {
  Anchor,
  Button,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { deleteTeam, renameTeam, setTeamMembers } from '../../features/tournament/api'
import { formatTournamentDate } from '../../features/tournament/date'
import {
  tournamentKeys,
  useAthletesCatalog,
  useTeam,
  useTeamCompetitionResults,
  useTeamHistory,
  useTeamMembers,
  useTeamNameHistory,
} from '../../features/tournament/hooks'
import { formatPlace } from '../../features/tournament/scoring'
import { ScoreSurface, SectionHead } from '../../components/ui'
import { entryTeamName } from '../../features/tournament/types'

export function TeamDetailPage() {
  const { teamId } = useParams()
  const { data: team, isLoading } = useTeam(teamId)
  const { data: members = [] } = useTeamMembers(teamId)
  const { data: history = [] } = useTeamHistory(teamId)
  const { data: nameHistory = [] } = useTeamNameHistory(teamId)
  const { data: results = [], isLoading: resultsLoading } = useTeamCompetitionResults(teamId)
  const { data: athletes = [] } = useAthletesCatalog()
  const { role } = useAuth()
  const canEdit = canManageTournament(role)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [editingMeta, setEditingMeta] = useState(false)
  const [editingRoster, setEditingRoster] = useState(false)
  const [name, setName] = useState('')
  const [slot1, setSlot1] = useState<string | null>(null)
  const [slot2, setSlot2] = useState<string | null>(null)

  useEffect(() => {
    if (team) setName(team.name)
  }, [team])

  useEffect(() => {
    setSlot1(members[0]?.athlete_id ?? null)
    setSlot2(members[1]?.athlete_id ?? null)
  }, [members])

  const athleteOptions = useMemo(
    () =>
      athletes.map((a) => {
        const onOther = a.current_team_id && a.current_team_id !== teamId
        return {
          value: a.id,
          label: onOther ? `${a.full_name} (сейчас: ${a.current_team_name})` : a.full_name,
        }
      }),
    [athletes, teamId],
  )

  const renameMutation = useMutation({
    mutationFn: () => renameTeam(teamId!, name),
    onSuccess: async () => {
      setEditingMeta(false)
      await queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['team', teamId, 'name-history'] })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
    },
  })

  const rosterMutation = useMutation({
    mutationFn: () => setTeamMembers(teamId!, [slot1!, slot2!]),
    onSuccess: async () => {
      setEditingRoster(false)
      await queryClient.invalidateQueries({ queryKey: ['team', teamId, 'members'] })
      await queryClient.invalidateQueries({ queryKey: ['team', teamId, 'memberships'] })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeam(teamId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
      navigate('/teams')
    },
  })

  if (isLoading) return <Text c="dimmed">Загрузка…</Text>
  if (!team) {
    return (
      <Stack gap="sm">
        <Text>Команда не найдена</Text>
        <Anchor component={Link} to="/teams" c="depth">
          К списку
        </Anchor>
      </Stack>
    )
  }

  return (
    <Stack gap="lg">
      <Anchor component={Link} to="/teams" size="sm" c="dimmed" hiddenFrom="md">
        ← Все команды
      </Anchor>

      <Group justify="space-between" align="flex-start">
        <Title order={2}>{team.name}</Title>
        {canEdit && !editingMeta && (
          <Group gap="xs">
            <Button variant="outline" color="depth" onClick={() => setEditingMeta(true)}>
              Переименовать
            </Button>
            <Button
              variant="light"
              color="red"
              loading={deleteMutation.isPending}
              onClick={() => {
                const memberNote =
                  members.length > 0
                    ? ' Текущий состав будет снят (рыбаки останутся в справочнике).'
                    : ''
                if (
                  !window.confirm(
                    `Удалить команду «${team.name}»?${memberNote} Снимки в протоколах турниров сохранятся.`,
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

      {editingMeta && (
        <Stack gap="sm">
          <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <Group>
            <Button
              color="depth"
              loading={renameMutation.isPending}
              disabled={!name.trim()}
              onClick={() => renameMutation.mutate()}
            >
              Сохранить
            </Button>
            <Button variant="subtle" onClick={() => setEditingMeta(false)}>
              Отмена
            </Button>
          </Group>
        </Stack>
      )}

      <Stack gap="xs">
        <SectionHead
          title="Текущий состав"
          order={4}
          action={
            canEdit ? (
              <Button
                size="compact-sm"
                variant="outline"
                color="depth"
                onClick={() => setEditingRoster((v) => !v)}
              >
                {editingRoster ? 'Отмена' : 'Изменить состав'}
              </Button>
            ) : undefined
          }
        />

        {!editingRoster && members.length === 0 && (
          <Text c="dimmed" size="sm">
            Состав не назначен. Организатор может выбрать двух рыбаков.
          </Text>
        )}
        {!editingRoster &&
          members.map((m) => (
            <Anchor key={m.id} component={Link} to={`/athletes/${m.athlete_id}`} c="depth">
              {m.athlete?.full_name}
            </Anchor>
          ))}

        {editingRoster && (
          <Stack gap="sm">
            <Select
              label="Рыбак 1"
              data={athleteOptions.filter((o) => o.value !== slot2)}
              value={slot1}
              onChange={setSlot1}
              searchable
            />
            <Select
              label="Рыбак 2"
              data={athleteOptions.filter((o) => o.value !== slot1)}
              value={slot2}
              onChange={setSlot2}
              searchable
            />
            <Text size="xs" c="dimmed">
              Сначала создайте рыбаков в разделе «Рыбаки», затем назначьте их сюда. Снимки турниров
              не изменятся.
            </Text>
            <Button
              color="depth"
              disabled={!slot1 || !slot2 || slot1 === slot2}
              loading={rosterMutation.isPending}
              onClick={() => rosterMutation.mutate()}
            >
              Сохранить состав
            </Button>
            {rosterMutation.isError && (
              <Text c="red" size="sm">
                {(rosterMutation.error as Error).message}
              </Text>
            )}
          </Stack>
        )}
      </Stack>

      <Stack gap="xs">
        <SectionHead title="История названий" order={4} />
        {nameHistory.length === 0 && (
          <Text c="dimmed" size="sm">
            Пока пусто
          </Text>
        )}
        {nameHistory.map((row) => (
          <Group
            key={row.id}
            justify="space-between"
            wrap="nowrap"
            py={6}
            style={{ borderBottom: '1px solid var(--pc-hairline)' }}
          >
            <Text size="sm" fw={row.ended_at ? 400 : 700}>
              {row.name}
            </Text>
            <Text size="xs" c="dimmed">
              {formatShort(row.started_at)}
              {row.ended_at ? ` — ${formatShort(row.ended_at)}` : ' — сейчас'}
            </Text>
          </Group>
        ))}
      </Stack>

      <Stack gap="xs">
        <SectionHead title="История составов" order={4} />
        {history.length === 0 && <Text c="dimmed" size="sm">Пока пусто</Text>}
        {history.map((m) => (
          <Group
            key={m.id}
            justify="space-between"
            py={6}
            style={{ borderBottom: '1px solid var(--pc-hairline)' }}
          >
            <Anchor component={Link} to={`/athletes/${m.athlete_id}`} size="sm" c="depth">
              {m.athlete?.full_name}
            </Anchor>
            <Text size="xs" c="dimmed">
              {formatShort(m.started_at)}
              {m.ended_at ? ` — ${formatShort(m.ended_at)}` : ' — сейчас'}
            </Text>
          </Group>
        ))}
      </Stack>

      <Stack gap="xs">
        <SectionHead title="Результаты соревнований" order={4} />
        {resultsLoading && (
          <Text c="dimmed" size="sm">
            Загрузка…
          </Text>
        )}
        {!resultsLoading && results.length === 0 && (
          <Text c="dimmed" size="sm">
            Команда ещё не участвовала в турнирах
          </Text>
        )}
        {results.map(({ entry, tournament, standing }) => (
          <ScoreSurface key={entry.id} p="sm">
            <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
              <div>
                <Anchor
                  component={Link}
                  to={`/tournament/${tournament.id}/results`}
                  fw={700}
                  c="depth"
                >
                  {tournament.name}
                </Anchor>
                <Text size="sm" c="dimmed">
                  {formatTournamentDate(tournament.event_date)} · {entryTeamName(entry)}
                </Text>
              </div>
              {standing ? (
                <Text size="sm" fw={800} className="pc-tabular">
                  Итог: {standing.finalPlace}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  Нет в зачёте
                </Text>
              )}
            </Group>
            <Text size="sm" c="dimmed" mt={4}>
              Состав:{' '}
              {(entry.roster ?? [])
                .slice()
                .sort((a, b) => a.slot - b.slot)
                .map((r) => r.full_name_snapshot)
                .join(' · ') || '—'}
            </Text>
            {standing && (
              <Text size="sm" mt={4} className="pc-tabular">
                Зона А: {standing.zoneAWeight} ({formatPlace(standing.zoneAPlace)}) · Зона Б:{' '}
                {standing.zoneBWeight} ({formatPlace(standing.zoneBPlace)}) · Σ мест{' '}
                {formatPlace(standing.placeSum)} · вес {standing.totalWeight}
              </Text>
            )}
          </ScoreSurface>
        ))}
      </Stack>
    </Stack>
  )
}

function formatShort(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU')
}
