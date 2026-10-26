import { SimpleGrid, Stack, Text } from '@mantine/core'
import { IconDeviceGamepad2, IconFishHook } from '@tabler/icons-react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate, statusLabel } from '../../features/tournament/date'
import { useEntries, useZoneJudges } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { ActionTile, EmptyState, PageHeader, Panel, SectionTitle, StepList, type StepItem } from '../../ui'

export function HqScreen() {
    const { role } = useAuth()
    const isOrg = canManageTournament(role)
    const { selected, tournaments } = useStaffTournament()
    const { data: entries = [] } = useEntries(selected?.id)
    const { data: judges = [] } = useZoneJudges(selected?.id)

    const assignedA = entries.filter((e) => e.start_zone === 'A').length
    const assignedB = entries.filter((e) => e.start_zone === 'B').length
    const unassigned = entries.filter((e) => !e.start_zone).length
    const judgesA = judges.filter((j) => j.zone === 'A').length
    const judgesB = judges.filter((j) => j.zone === 'B').length
    const rulesLen = selected?.rules_content?.trim().length ?? 0
    const rulesLocked = Boolean(selected?.rules_locked_at)

    const prepSteps: StepItem[] = [
        {
            to: '/staff/tournament',
            title: 'Турнир',
            done: Boolean(selected),
            warn: !selected,
            status: selected ? `${selected.name} · ${statusLabel[selected.status]}` : 'Выберите турнир в меню',
        },
        {
            to: '/staff/tournament?tab=rules',
            title: 'Регламент',
            done: rulesLocked || rulesLen > 40,
            warn: Boolean(selected) && !rulesLocked && rulesLen <= 40,
            status: !selected ? 'Нужен турнир' : rulesLocked ? 'Зафиксирован' : rulesLen > 40 ? 'Черновик готов' : 'Не заполнен',
        },
        {
            to: '/staff/entries',
            title: 'Заявки',
            done: entries.length > 0,
            warn: Boolean(selected) && entries.length === 0,
            status: !selected ? 'Нужен турнир' : entries.length > 0 ? `${entries.length} команд` : 'Нет заявок',
        },
        {
            to: '/staff/draw',
            title: 'Зоны',
            done: entries.length > 0 && unassigned === 0,
            warn: entries.length > 0 && unassigned > 0,
            status: !selected
                ? 'Нужен турнир'
                : entries.length === 0
                  ? 'Сначала заявки'
                  : unassigned === 0
                    ? `A: ${assignedA} · B: ${assignedB}`
                    : `Без зоны: ${unassigned}`,
        },
        {
            to: '/staff/tournament?tab=judges',
            title: 'Судьи',
            done: judgesA > 0 && judgesB > 0,
            warn: Boolean(selected) && (judgesA === 0 || judgesB === 0),
            status: !selected ? 'Нужен турнир' : judgesA > 0 && judgesB > 0 ? `A: ${judgesA} · B: ${judgesB}` : `A: ${judgesA || '—'} · B: ${judgesB || '—'}`,
        },
    ]

    if (!isOrg) {
        return (
            <Stack gap="lg">
                <div>
                    <PageHeader title="Судейский день" />
                    <Text size="sm" c="dimmed" mt={4}>
                        {selected ? `${selected.name} · ${formatTournamentDate(selected.event_date)}` : 'Выберите турнир в меню, затем откройте пульт.'}
                    </Text>
                </div>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <ActionTile to="/staff/console" title="Пульт" description="Взвешивание на зоне" icon={IconDeviceGamepad2} disabled={!selected} />
                </SimpleGrid>
            </Stack>
        )
    }

    return (
        <Stack gap="lg">
            <div>
                <PageHeader title="Штаб" />
                <Text size="sm" c="dimmed" mt={4}>
                    Подготовка турнира, затем день соревнований.
                    {selected ? ` ${formatTournamentDate(selected.event_date)} · ${selected.location}` : ''}
                </Text>
            </div>

            {!selected && tournaments.length === 0 && (
                <EmptyState
                    title="Нет турниров"
                    description="Когда турнир появится в списке, его можно править в разделе «Турнир»."
                />
            )}

            {isOrg && (
                <div>
                    <SectionTitle>Подготовка</SectionTitle>
                    <Panel p="sm">
                        <StepList steps={prepSteps} />
                    </Panel>
                </div>
            )}

            <div>
                <SectionTitle>День турнира</SectionTitle>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <ActionTile to="/staff/console" title="Пульт" description="Взвешивание на зоне" icon={IconDeviceGamepad2} disabled={!selected} />
                    <ActionTile to="/staff/catches" title="Улов" description="Полный журнал турнира" icon={IconFishHook} disabled={!selected} />
                </SimpleGrid>
            </div>
        </Stack>
    )
}
