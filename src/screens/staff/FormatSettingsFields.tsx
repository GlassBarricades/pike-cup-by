import {
  Checkbox,
  Divider,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from '@mantine/core'
import {
  legacyDrawMode,
  zoneCodes,
  type LegacyDrawMode,
  type TournamentFormat,
} from '../../features/tournament/formats'

function applyLegacyDraw(prev: TournamentFormat, mode: LegacyDrawMode): TournamentFormat['draw'] {
  if (mode === 'none') {
    return { ...prev.draw, method: 'none' }
  }
  if (mode === 'pikecup_slips') {
    return {
      ...prev.draw,
      level: 'entry',
      method: 'slips',
      slipPackId: prev.draw.slipPackId ?? 'pikecup',
    }
  }
  return {
    ...prev.draw,
    level: 'athlete',
    method: prev.draw.method === 'none' ? 'slips' : prev.draw.method,
    slipPackId: prev.draw.slipPackId ?? 'boor',
  }
}

type Props = {
  value: TournamentFormat
  onChange: (next: TournamentFormat) => void
  disabled?: boolean
}

/** Controlled format settings form — shared by tournament and preset editors. */
export function FormatSettingsFields({ value, onChange, disabled }: Props) {
  const draft = value
  const zonesText = zoneCodes(draft).join(',')
  const tour1Minis = draft.structure.tours.find((t) => t.number === 1)?.minis ?? 3
  const tour2Minis = draft.structure.tours.find((t) => t.number === 2)?.minis ?? 3

  const patch = (updater: (prev: TournamentFormat) => TournamentFormat) => {
    onChange(updater(draft))
  }

  const setTourMinis = (tourNumber: number, minis: number) => {
    patch((prev) => ({
      ...prev,
      structure: {
        ...prev.structure,
        tours: prev.structure.tours.map((t) => (t.number === tourNumber ? { ...t, minis } : t)),
      },
    }))
  }

  return (
    <Stack gap="md">
      <Divider label="Структура" labelPosition="left" />
      <NumberInput
        label="Мини-туров в I туре"
        min={1}
        max={20}
        value={tour1Minis}
        onChange={(v) => setTourMinis(1, Number(v) || 1)}
        disabled={disabled}
      />
      <NumberInput
        label="Мини-туров во II туре"
        min={1}
        max={20}
        value={tour2Minis}
        onChange={(v) => setTourMinis(2, Number(v) || 1)}
        disabled={disabled}
      />
      <TextInput
        label="Зоны (через запятую)"
        value={zonesText}
        onChange={(e) => {
          const codes = e.currentTarget.value
            .split(',')
            .map((z) => z.trim())
            .filter(Boolean)
          patch((prev) => ({
            ...prev,
            structure: {
              ...prev.structure,
              zones: codes.map((code) => {
                const existing = prev.structure.zones.find((z) => z.code === code)
                return existing ?? { code, label: `Зона ${code}` }
              }),
            },
          }))
        }}
        disabled={disabled}
      />
      <Select
        label="Ротация зон"
        data={[
          { value: 'swap_pairs', label: 'Смена пар (A↔B)' },
          { value: 'cycle', label: 'Цикл по зонам' },
          { value: 'fixed', label: 'Фиксированные' },
          { value: 'redraw_each_tour', label: 'Пережеребьёвка каждый тур' },
        ]}
        value={draft.structure.zoneRotation}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            structure: {
              ...prev.structure,
              zoneRotation: v as TournamentFormat['structure']['zoneRotation'],
            },
          }))
        }}
        disabled={disabled}
      />

      <Divider label="Участники" labelPosition="left" />
      <Select
        label="Режим участников"
        data={[
          { value: 'teams', label: 'Только команды' },
          { value: 'teams_and_solo', label: 'Команды и личники' },
          { value: 'individual', label: 'Только личный' },
        ]}
        value={draft.participants.mode}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              mode: v as TournamentFormat['participants']['mode'],
            },
            standings:
              v === 'individual'
                ? { ...prev.standings, team: false, individual: true }
                : prev.standings,
          }))
        }}
        disabled={disabled}
      />
      <Select
        label="Улов учитывается"
        data={[
          { value: 'entry', label: 'На команду (entry)' },
          { value: 'athlete', label: 'На спортсмена (athlete)' },
        ]}
        value={draft.participants.catchUnit}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              catchUnit: v as TournamentFormat['participants']['catchUnit'],
            },
            draw:
              v === 'entry' && prev.draw.level === 'athlete'
                ? { ...prev.draw, level: 'entry' }
                : prev.draw,
          }))
        }}
        disabled={disabled}
      />
      <NumberInput
        label="Мин. спортсменов"
        min={1}
        max={10}
        value={draft.participants.roster.minAthletes}
        onChange={(v) => {
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              roster: { ...prev.participants.roster, minAthletes: Number(v) || 1 },
            },
          }))
        }}
        disabled={disabled}
      />
      <NumberInput
        label="Макс. спортсменов"
        min={1}
        max={10}
        value={draft.participants.roster.maxAthletes}
        onChange={(v) => {
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              roster: { ...prev.participants.roster, maxAthletes: Number(v) || 1 },
            },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Капитан в заявке"
        checked={draft.participants.roster.captain}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              roster: { ...prev.participants.roster, captain: checked },
            },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Представитель в заявке"
        checked={draft.participants.roster.representative}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              roster: { ...prev.participants.roster, representative: checked },
            },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Отмечать юниоров"
        checked={draft.participants.juniors.mark}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            participants: {
              ...prev.participants,
              juniors: { ...prev.participants.juniors, mark: checked },
            },
          }))
        }}
        disabled={disabled}
      />

      <Divider label="Улов" labelPosition="left" />
      <Select
        label="Единица измерения"
        data={[
          { value: 'weight', label: 'Вес' },
          { value: 'count', label: 'Количество' },
          { value: 'length', label: 'Длина' },
        ]}
        value={draft.catch.measure}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            catch: { ...prev.catch, measure: v as TournamentFormat['catch']['measure'] },
          }))
        }}
        disabled={disabled}
      />
      <NumberInput
        label="Лимит рыб (пусто = без лимита)"
        min={0}
        max={100}
        value={draft.catch.bagLimit ?? ''}
        onChange={(v) => {
          patch((prev) => ({
            ...prev,
            catch: {
              ...prev.catch,
              bagLimit: v === '' || v == null ? null : Number(v),
            },
          }))
        }}
        disabled={disabled}
      />
      <NumberInput
        label="Мин. вес рыбы, г (пусто = без порога)"
        min={0}
        max={50000}
        value={draft.catch.minFishWeightG ?? ''}
        onChange={(v) => {
          patch((prev) => ({
            ...prev,
            catch: {
              ...prev.catch,
              minFishWeightG: v === '' || v == null ? null : Number(v),
            },
          }))
        }}
        disabled={disabled}
      />

      <Divider label="Скоринг" labelPosition="left" />
      <Select
        label="Группа ранжирования"
        data={[
          { value: 'zone_tour', label: 'Зона × тур' },
          { value: 'tour', label: 'Весь тур' },
        ]}
        value={draft.scoring.group}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            scoring: { ...prev.scoring, group: v as TournamentFormat['scoring']['group'] },
          }))
        }}
        disabled={disabled}
      />
      <Select
        label="Место при нулевом улове"
        data={[
          { value: 'group_size_plus_one', label: 'n + 1' },
          { value: 'group_size', label: 'n' },
        ]}
        value={draft.scoring.zeroPlace}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            scoring: {
              ...prev.scoring,
              zeroPlace: v as TournamentFormat['scoring']['zeroPlace'],
            },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Среднее место при ничьей"
        checked={draft.scoring.tieAverage}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            scoring: { ...prev.scoring, tieAverage: checked },
          }))
        }}
        disabled={disabled}
      />
      <Select
        label="Командный счёт"
        data={[
          { value: 'own_places', label: 'Свои места команды' },
          { value: 'sum_athlete_places', label: 'Сумма мест спортсменов' },
        ]}
        value={draft.scoring.teamScore}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            scoring: {
              ...prev.scoring,
              teamScore: v as TournamentFormat['scoring']['teamScore'],
            },
          }))
        }}
        disabled={disabled}
      />

      <Divider label="Зачёты" labelPosition="left" />
      <Checkbox
        label="Командный зачёт"
        checked={draft.standings.team}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            standings: { ...prev.standings, team: checked },
          }))
        }}
        disabled={disabled || draft.participants.mode === 'individual'}
      />
      <Checkbox
        label="Личный зачёт"
        checked={draft.standings.individual}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            standings: {
              ...prev.standings,
              individual: checked,
              juniors: checked ? prev.standings.juniors : false,
            },
            participants: {
              ...prev.participants,
              juniors: {
                ...prev.participants.juniors,
                separateStandings: checked
                  ? prev.participants.juniors.separateStandings
                  : false,
              },
            },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Отдельный зачёт юниоров"
        description="Две личные таблицы: общая (все, включая юниоров) и юниоры (отдельный пересчёт). Команда из общей лички."
        checked={Boolean(draft.standings.juniors && draft.participants.juniors.separateStandings)}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            standings: { ...prev.standings, juniors: checked },
            participants: {
              ...prev.participants,
              juniors: {
                ...prev.participants.juniors,
                mark: checked ? true : prev.participants.juniors.mark,
                separateStandings: checked,
              },
            },
          }))
        }}
        disabled={disabled || !draft.standings.individual}
      />

      <Divider label="Жеребьёвка" labelPosition="left" />
      <Select
        label="Тип жеребьёвки"
        data={[
          { value: 'pikecup_slips', label: 'Бумажки PikeCup' },
          { value: 'per_athlete_sectors', label: 'Секторы спортсменов' },
          { value: 'none', label: 'Без жеребьёвки' },
        ]}
        value={legacyDrawMode(draft)}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            draw: applyLegacyDraw(prev, v as LegacyDrawMode),
          }))
        }}
        disabled={disabled}
      />
      <Select
        label="Метод"
        data={[
          { value: 'slips', label: 'Бумажки' },
          { value: 'random', label: 'Случайный' },
          { value: 'manual', label: 'Вручную' },
          { value: 'none', label: 'Нет' },
        ]}
        value={draft.draw.method}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            draw: { ...prev.draw, method: v as TournamentFormat['draw']['method'] },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Только зоны (без секторов)"
        checked={draft.draw.zonesOnly}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            draw: { ...prev.draw, zonesOnly: checked },
          }))
        }}
        disabled={disabled}
      />

      <Divider label="Настройка" labelPosition="left" />
      <Select
        label="Режим карты"
        data={[
          { value: 'schematic', label: 'Схема' },
          { value: 'geo', label: 'Геокарта' },
        ]}
        value={draft.setup.mapMode}
        onChange={(v) => {
          if (!v) return
          patch((prev) => ({
            ...prev,
            setup: { ...prev.setup, mapMode: v as TournamentFormat['setup']['mapMode'] },
          }))
        }}
        disabled={disabled}
      />
      <NumberInput
        label="Минут ловли в мини-туре"
        min={5}
        max={240}
        value={draft.setup.scheduleTemplate.fishingMinutes}
        onChange={(v) => {
          patch((prev) => ({
            ...prev,
            setup: {
              ...prev.setup,
              scheduleTemplate: {
                ...prev.setup.scheduleTemplate,
                fishingMinutes: Number(v) || 50,
              },
            },
          }))
        }}
        disabled={disabled}
      />
      <NumberInput
        label="Минут перехода"
        min={0}
        max={120}
        value={draft.setup.scheduleTemplate.moveMinutes}
        onChange={(v) => {
          patch((prev) => ({
            ...prev,
            setup: {
              ...prev.setup,
              scheduleTemplate: {
                ...prev.setup.scheduleTemplate,
                moveMinutes: Number(v) || 0,
              },
            },
          }))
        }}
        disabled={disabled}
      />
      <TextInput
        label="Старт дня (HH:MM)"
        value={draft.setup.scheduleTemplate.dayStartTime ?? ''}
        onChange={(e) => {
          const next = e.currentTarget.value.trim()
          patch((prev) => ({
            ...prev,
            setup: {
              ...prev.setup,
              scheduleTemplate: {
                ...prev.setup.scheduleTemplate,
                dayStartTime: next || undefined,
              },
            },
          }))
        }}
        disabled={disabled}
      />
      <Checkbox
        label="Подсказка регламента зрителям"
        checked={draft.setup.spectatorRulesHint}
        onChange={(e) => {
          const checked = e.currentTarget.checked
          patch((prev) => ({
            ...prev,
            setup: { ...prev.setup, spectatorRulesHint: checked },
          }))
        }}
        disabled={disabled}
      />
    </Stack>
  )
}
