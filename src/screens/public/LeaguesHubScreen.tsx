import { useMemo, useState } from 'react'
import { Button, Select, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { createLeague } from '../../features/tournament/api'
import {
  LEAGUE_KIND_LABEL,
  REGION_OPTIONS,
  regionLabel,
  slugifyLeagueName,
} from '../../features/tournament/leagueLabels'
import { invalidateTournamentLists, useLeagues } from '../../features/tournament/hooks'
import type { LeagueKind } from '../../features/tournament/types'
import { EmptyState, PageHeader, Panel, SectionTitle, SurfaceCard } from '../../ui'

export function LeaguesHubScreen() {
  const { data: leagues = [], isLoading } = useLeagues()
  const { role } = useAuth()
  const canManage = canManageTournament(role)

  const sorted = useMemo(
    () =>
      [...leagues].sort((a, b) => {
        const kindOrder = { national: 0, regional: 1, other: 2 } as const
        const byKind = kindOrder[a.kind] - kindOrder[b.kind]
        if (byKind !== 0) return byKind
        return a.name.localeCompare(b.name, 'ru')
      }),
    [leagues],
  )

  if (isLoading) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  return (
    <div className="pc-page">
      <Stack gap="lg">
        <PageHeader title="Лиги" />
        <Text size="sm" c="dimmed">
          Национальные и областные серии. Фестивали без лиги — в отдельном разделе.
        </Text>

        {sorted.length === 0 ? (
          <EmptyState title="Лиг пока нет" description="Организатор может создать первую лигу." />
        ) : (
          <Stack gap="xs">
            {sorted.map((league) => (
              <SurfaceCard
                key={league.id}
                to={`/leagues/${league.slug}`}
                title={league.name}
                lines={[
                  [LEAGUE_KIND_LABEL[league.kind], regionLabel(league.region_code)].filter(Boolean).join(' · '),
                ]}
              />
            ))}
          </Stack>
        )}

        <Button component={Link} to="/festivals" variant="outline" color="gray">
          Фестивали
        </Button>

        {canManage && <CreateLeaguePanel />}
      </Stack>
    </div>
  )
}

function CreateLeaguePanel() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [slug, setSlug] = useState('')
  const [kind, setKind] = useState<LeagueKind>('regional')
  const [regionCode, setRegionCode] = useState<string | null>('brest')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      createLeague({
        name,
        shortName: shortName || name,
        slug: slug || slugifyLeagueName(name),
        kind,
        regionCode: kind === 'regional' ? regionCode : null,
        description,
      }),
    onSuccess: async () => {
      await invalidateTournamentLists(queryClient)
      setName('')
      setShortName('')
      setSlug('')
      setDescription('')
    },
  })

  return (
    <Panel>
      <Stack gap="md">
        <SectionTitle>Новая лига</SectionTitle>
        <TextInput
          label="Название"
          value={name}
          onChange={(e) => {
            const next = e.currentTarget.value
            setName(next)
            if (!slug || slug === slugifyLeagueName(name)) {
              setSlug(slugifyLeagueName(next))
            }
            if (!shortName || shortName === name) setShortName(next)
          }}
          placeholder="Брестская область"
        />
        <TextInput
          label="Короткое имя"
          value={shortName}
          onChange={(e) => setShortName(e.currentTarget.value)}
        />
        <TextInput
          label="Slug"
          description="Латиница для URL"
          value={slug}
          onChange={(e) => setSlug(e.currentTarget.value.toLowerCase())}
        />
        <Select
          label="Тип"
          data={[
            { value: 'national', label: LEAGUE_KIND_LABEL.national },
            { value: 'regional', label: LEAGUE_KIND_LABEL.regional },
            { value: 'other', label: LEAGUE_KIND_LABEL.other },
          ]}
          value={kind}
          onChange={(v) => setKind((v as LeagueKind) ?? 'regional')}
        />
        {kind === 'regional' && (
          <Select
            label="Область"
            data={[...REGION_OPTIONS]}
            value={regionCode}
            onChange={setRegionCode}
            searchable
          />
        )}
        <Textarea
          label="Описание"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={2}
        />
        <Button
          color="signal"
          disabled={!name.trim() || !(slug || slugifyLeagueName(name)) || (kind === 'regional' && !regionCode)}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Создать лигу
        </Button>
        {mutation.isError && (
          <Text c="red" size="sm">
            {(mutation.error as Error).message}
          </Text>
        )}
        {mutation.isSuccess && (
          <Text size="sm" c="dimmed">
            Лига создана
          </Text>
        )}
      </Stack>
    </Panel>
  )
}
