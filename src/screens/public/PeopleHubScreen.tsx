import { Stack } from '@mantine/core'
import { PageHero, TabsBar } from '../../ui'
import { AthletesListPanel } from './AthletesListPanel'
import { TeamsListPanel } from './TeamsListPanel'

export function PeopleHubScreen() {
  return (
    <div className="pc-page">
      <Stack gap="lg">
        <PageHero title="Участники" subtitle="Справочник рыбаков и команд" mb={0} />
        <TabsBar
          tabs={[
            { value: 'athletes', label: 'Рыбаки' },
            { value: 'teams', label: 'Команды' },
          ]}
          defaultTab="athletes"
        >
          {(active) => (active === 'teams' ? <TeamsListPanel /> : <AthletesListPanel />)}
        </TabsBar>
      </Stack>
    </div>
  )
}
