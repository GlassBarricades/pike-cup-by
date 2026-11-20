import { useState } from 'react'
import { Badge, Button, Checkbox, Group, MultiSelect, Select, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createEntryFromTeam,
  createSoloEntry,
  deleteAllEntries,
  deleteEntry,
  lockAllRosters,
} from '../../features/tournament/api'
import { getFormat } from '../../features/tournament/formats'
import { tournamentKeys, useEntries, useTeamsCatalog } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import {
  entryListTitle,
  isSoloEntry,
  type TeamQuota,
} from '../../features/tournament/types'
import { ClosedDayNotice, EmptyState, PageHero, Panel, SectionTitle } from '../../ui'

export function EntriesScreen() {
  const { selected: tournament } = useStaffTournament()
  const closed = useTournamentDayClosed()
  const { data: teams = [] } = useTeamsCatalog()
  const { data: entries = [] } = useEntries(tournament?.id)
  const queryClient = useQueryClient()
  const format = tournament ? getFormat(tournament) : null
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [quota, setQuota] = useState<TeamQuota>('open')
  const [phone, setPhone] = useState('')
  const [captainName, setCaptainName] = useState('')
  const [repName, setRepName] = useState('')
  const [batchMessage, setBatchMessage] = useState<string | null>(null)
  const [soloName, setSoloName] = useState('')
  const [soloPhone, setSoloPhone] = useState('')
  const [soloJunior, setSoloJunior] = useState(false)
  const [soloMessage, setSoloMessage] = useState<string | null>(null)

  const enteredIds = new Set(
    entries.map((e) => e.team_id).filter((id): id is string => Boolean(id)),
  )
  const available = teams.filter((t) => !enteredIds.has(t.id))
  const individualEnabled = format?.engine === 'individual'

  const addMutation = useMutation({
    mutationFn: async () => {
      const errors: string[] = []
      let ok = 0

      for (const teamId of teamIds) {
        const teamName = teams.find((t) => t.id === teamId)?.name ?? teamId
        try {
          const extraRoster = []
          if (format?.roster.captain && captainName.trim()) {
            extraRoster.push({ fullName: captainName.trim(), role: 'captain' as const })
          }
          if (format?.roster.representative && repName.trim()) {
            extraRoster.push({ fullName: repName.trim(), role: 'representative' as const })
          }
          await createEntryFromTeam({
            tournamentId: tournament!.id,
            teamId,
            quota,
            contactPhone: phone || undefined,
            format: format ?? undefined,
            extraRoster,
          })
          ok += 1
        } catch (e) {
          errors.push(`${teamName}: ${(e as Error).message}`)
        }
      }

      if (ok === 0 && errors.length > 0) {
        throw new Error(errors.join('\n'))
      }

      return { ok, errors }
    },
    onSuccess: async (result) => {
      setTeamIds([])
      setPhone('')
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament!.id) })
      if (result.errors.length > 0) {
        setBatchMessage(`Добавлено: ${result.ok}. Не удалось:\n${result.errors.join('\n')}`)
      } else {
        setBatchMessage(`Добавлено команд: ${result.ok}`)
      }
    },
    onError: () => setBatchMessage(null),
  })

  const soloMutation = useMutation({
    mutationFn: () =>
      createSoloEntry({
        tournamentId: tournament!.id,
        fullName: soloName,
        contactPhone: soloPhone || undefined,
        isJunior: soloJunior,
        quota: 'open',
      }),
    onSuccess: async () => {
      setSoloName('')
      setSoloPhone('')
      setSoloJunior(false)
      setSoloMessage('Добавлен участник без команды (только личный зачёт)')
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament!.id) })
    },
    onError: () => setSoloMessage(null),
  })

  const lockMutation = useMutation({
    mutationFn: () => lockAllRosters(tournament!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament!.id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteEntry(entryId),
    onSuccess: async () => {
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament.id) })
      }
    },
  })

  const deleteAllMutation = useMutation({
    mutationFn: () => deleteAllEntries(tournament!.id),
    onSuccess: async () => {
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament.id) })
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.athleteDraws(tournament.id) })
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournament.id) })
      }
    },
  })

  if (!tournament) {
    return (
      <EmptyState
        title="Нет турнира"
        description="Выберите турнир сверху, чтобы управлять заявками."
      />
    )
  }

  return (
    <Stack gap="lg">
      <PageHero
        title="Заявки на турнир"
        subtitle={
          format
            ? `Можно выбрать несколько команд. Состав: ${format.roster.minAthletes}–${format.roster.maxAthletes} спортсменов в справочнике (копируется в снимок турнира).`
            : 'Выберите турнир.'
        }
      />

      {closed && <ClosedDayNotice />}

      <Panel>
        <Stack gap="md">
          <MultiSelect
            label="Команды"
            data={available.map((t) => ({ value: t.id, label: t.name }))}
            value={teamIds}
            onChange={setTeamIds}
            searchable
            clearable
            placeholder="Выберите одну или несколько команд"
            nothingFoundMessage="Нет доступных команд"
            disabled={closed}
          />
          <Select
            label="Квота (для всех выбранных)"
            data={[
              { value: 'open', label: 'Open (50)' },
              { value: 'prize', label: 'Призёры (10)' },
              { value: 'org', label: 'Оргкомитет (10)' },
            ]}
            value={quota}
            onChange={(v) => setQuota((v as TeamQuota) ?? 'open')}
            disabled={closed}
          />
          <TextInput
            label="Телефон на заявке (опционально, для всех)"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
            disabled={closed}
          />
          {format?.roster.captain && (
            <TextInput
              label="Капитан (ФИО, опционально, для всех выбранных)"
              value={captainName}
              onChange={(e) => setCaptainName(e.currentTarget.value)}
              disabled={closed}
            />
          )}
          {format?.roster.representative && (
            <TextInput
              label="Представитель (ФИО, опционально)"
              value={repName}
              onChange={(e) => setRepName(e.currentTarget.value)}
              disabled={closed}
            />
          )}
          <Button
            color="signal"
            disabled={closed || teamIds.length === 0}
            loading={addMutation.isPending}
            onClick={() => {
              setBatchMessage(null)
              addMutation.mutate()
            }}
          >
            Добавить {teamIds.length > 0 ? `(${teamIds.length})` : ''} на турнир
          </Button>
          {addMutation.isError && (
            <Text c="red" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {(addMutation.error as Error).message}
            </Text>
          )}
          {batchMessage && (
            <Text
              c={batchMessage.includes('Не удалось') ? 'orange' : 'teal'}
              size="sm"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {batchMessage}
            </Text>
          )}

          <Button
            variant="outline"
            color="orange"
            disabled={closed}
            loading={lockMutation.isPending}
            onClick={() => lockMutation.mutate()}
          >
            Зафиксировать все составы
          </Button>
        </Stack>
      </Panel>

      {individualEnabled && (
        <Panel>
          <Stack gap="md">
            <SectionTitle>Участник без команды</SectionTitle>
            <Text size="sm" c="dimmed">
              Только личный зачёт — в командную таблицу не попадает.
            </Text>
            <TextInput
              label="ФИО спортсмена"
              value={soloName}
              onChange={(e) => setSoloName(e.currentTarget.value)}
              disabled={closed}
              placeholder="Иванов Иван"
            />
            <TextInput
              label="Телефон (опционально)"
              value={soloPhone}
              onChange={(e) => setSoloPhone(e.currentTarget.value)}
              disabled={closed}
            />
            <Checkbox
              label="Юниор"
              checked={soloJunior}
              onChange={(e) => setSoloJunior(e.currentTarget.checked)}
              disabled={closed}
            />
            <Button
              color="signal"
              variant="light"
              disabled={closed || !soloName.trim()}
              loading={soloMutation.isPending}
              onClick={() => {
                setSoloMessage(null)
                soloMutation.mutate()
              }}
            >
              Добавить личника
            </Button>
            {soloMutation.isError && (
              <Text c="red" size="sm">
                {(soloMutation.error as Error).message}
              </Text>
            )}
            {soloMessage && (
              <Text c="teal" size="sm">
                {soloMessage}
              </Text>
            )}
          </Stack>
        </Panel>
      )}

      <div>
        <Group justify="space-between" align="center" wrap="wrap" mb="xs">
          <SectionTitle>Заявки ({entries.length})</SectionTitle>
          <Button
            size="xs"
            variant="outline"
            color="red"
            disabled={closed || entries.length === 0}
            loading={deleteAllMutation.isPending}
            onClick={() => {
              if (
                !window.confirm(
                  `Удалить все заявки (${entries.length})? Составы, жеребьёвка и уловы этих заявок на турнире тоже будут удалены. Команды в справочнике останутся.`,
                )
              ) {
                return
              }
              deleteAllMutation.mutate()
            }}
          >
            Удалить все заявки
          </Button>
        </Group>
        {deleteMutation.isError && (
          <Text c="red" size="sm" mb="sm">
            {(deleteMutation.error as Error).message}
          </Text>
        )}
        {deleteAllMutation.isError && (
          <Text c="red" size="sm" mb="sm">
            {(deleteAllMutation.error as Error).message}
          </Text>
        )}
        <Panel p={0}>
          {entries.map((e, i) => (
            <Group
              key={e.id}
              justify="space-between"
              align="flex-start"
              wrap="nowrap"
              px="sm"
              py={8}
              style={{
                borderBottom: i < entries.length - 1 ? '1px solid var(--pc-line)' : undefined,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Text fw={800} size="sm">
                  {entryListTitle(e)}
                </Text>
                {!isSoloEntry(e) && (
                  <Text size="xs" c="dimmed" lineClamp={2}>
                    {(e.roster ?? [])
                      .slice()
                      .sort((a, b) => a.slot - b.slot)
                      .map((r) => (r.is_junior ? `${r.full_name_snapshot} (юн.)` : r.full_name_snapshot))
                      .join(' · ') || 'Состав пуст'}
                  </Text>
                )}
                <Group gap={6} mt={2}>
                  <Text size="xs" c="dimmed" className="pc-tabular">
                    {e.quota} · {e.status}
                    {e.roster_locked_at ? ' · зафиксирован' : ''}
                    {isSoloEntry(e) ? ' · только личный' : ''}
                  </Text>
                  {(e.roster ?? []).some((r) => r.role === 'athlete' && r.is_junior) && (
                    <Badge size="xs" color="teal" variant="light">
                      Юниор
                    </Badge>
                  )}
                </Group>
              </div>
              <Button
                size="compact-xs"
                color="red"
                variant="subtle"
                disabled={closed}
                loading={deleteMutation.isPending && deleteMutation.variables === e.id}
                onClick={() => {
                  const name = entryListTitle(e)
                  if (
                    !window.confirm(
                      `Удалить заявку «${name}»? Состав и связанные уловы этой заявки на турнире тоже будут удалены.`,
                    )
                  ) {
                    return
                  }
                  deleteMutation.mutate(e.id)
                }}
              >
                Удалить
              </Button>
            </Group>
          ))}
          {entries.length === 0 && (
            <Text c="dimmed" size="sm" p="sm">
              Заявок пока нет
            </Text>
          )}
        </Panel>
      </div>
    </Stack>
  )
}
