import { useState } from 'react'
import { ActionIcon, Button, Stack, Text, UnstyledButton, Group } from '@mantine/core'
import { IconArrowLeft, IconBackspace } from '@tabler/icons-react'

export function WeightNumpad({
  subjectName,
  recordedGrams,
  targetLabel,
  saving,
  error,
  onSave,
  onClose,
}: {
  subjectName: string
  recordedGrams: number
  targetLabel: string | null
  saving: boolean
  error: string | null
  onSave: (grams: number) => void
  onClose: () => void
}) {
  const [digits, setDigits] = useState('')

  const value = Number(digits) || 0
  const canSave = value > 0

  const press = (d: string) => {
    if (saving) return
    setDigits((prev) => {
      if (prev.length >= 6) return prev
      if (prev === '0') return d
      return prev + d
    })
  }

  const backspace = () => {
    if (saving) return
    setDigits((prev) => prev.slice(0, -1))
  }
  const clear = () => {
    if (saving) return
    setDigits('')
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const

  return (
    <div className="pc-judge-numpad-overlay" role="dialog" aria-label="Ввод веса">
      <Stack gap="md" className="pc-judge-numpad" p="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
              Новое взвешивание
            </Text>
            <Text fw={800} size="lg" lineClamp={2}>
              {subjectName}
            </Text>
          </div>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={onClose} disabled={saving} aria-label="Назад">
            <IconArrowLeft size={22} />
          </ActionIcon>
        </Group>

        <Text size="sm" ta="center" c={targetLabel ? undefined : 'dimmed'}>
          {targetLabel ? `Запишется в ${targetLabel}` : 'Сейчас некуда записать улов'}
        </Text>

        <Text className="pc-judge-weight-display pc-tabular" ta="center">
          {digits || '0'}
          <Text span size="sm" c="dimmed" ml={6}>
            г
          </Text>
        </Text>
        {recordedGrams > 0 && (
          <Text size="sm" c="dimmed" ta="center">
            Уже записано {recordedGrams} г — эта фиксация прибавится к сумме
          </Text>
        )}

        <div className="pc-judge-keypad">
          {keys.map((k) => {
            if (k === 'clear') {
              return (
                <UnstyledButton key={k} className="pc-judge-key pc-judge-key-muted" onClick={clear}>
                  C
                </UnstyledButton>
              )
            }
            if (k === 'back') {
              return (
                <UnstyledButton key={k} className="pc-judge-key pc-judge-key-muted" onClick={backspace} aria-label="Стереть">
                  <IconBackspace size={28} />
                </UnstyledButton>
              )
            }
            return (
              <UnstyledButton key={k} className="pc-judge-key" onClick={() => press(k)}>
                {k}
              </UnstyledButton>
            )
          })}
        </div>

        {error && (
          <Text c="red" size="sm" ta="center">
            {error}
          </Text>
        )}

        <Button
          color="signal"
          size="xl"
          h={56}
          disabled={!canSave || saving || !targetLabel}
          loading={saving}
          loaderProps={{ color: 'white', type: 'oval' }}
          onClick={() => onSave(value)}
        >
          {saving ? 'Сохранение' : 'Записать'}
        </Button>

        <Button variant="subtle" color="gray" onClick={onClose} disabled={saving}>
          Назад
        </Button>
      </Stack>
    </div>
  )
}
