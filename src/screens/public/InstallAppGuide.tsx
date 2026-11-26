import { Box, Button, Checkbox, FocusTrap, Modal, Stack, Text } from '@mantine/core'
import { useLocalStorage, useMediaQuery } from '@mantine/hooks'
import {
  IconDeviceMobilePlus,
  IconDotsCircleHorizontal,
  IconDotsVertical,
  IconDownload,
  IconPlus,
  IconShare2,
  IconSquarePlus,
} from '@tabler/icons-react'
import { useState } from 'react'

const INSTALL_GUIDE_DISMISSED_KEY = 'install-guide-dismissed'

const androidInstallSteps = [
  { label: 'Откройте меню рядом с адресной строкой', Icon: IconDotsVertical },
  {
    label: 'Выберите «Установить или создать ярлык» или «Добавить на главный экран»',
    Icon: IconDeviceMobilePlus,
  },
  { label: 'Нажмите «Установить»', Icon: IconDownload },
]

const iosInstallSteps = [
  { label: 'Поделиться', Icon: IconShare2 },
  { label: 'Ещё', Icon: IconDotsCircleHorizontal },
  { label: 'Добавить на экран «Домой»', Icon: IconSquarePlus },
  { label: 'Добавить', Icon: IconPlus },
]

export function InstallAppGuide() {
  const [opened, setOpened] = useState(true)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [dismissed, setDismissed] = useLocalStorage({
    key: INSTALL_GUIDE_DISMISSED_KEY,
    defaultValue: false,
    getInitialValueInEffect: false,
  })
  const { userAgent, standalone } = navigator as Navigator & { standalone?: boolean }
  const isAndroid = /Android/i.test(userAgent)
  const isIOS = /iPhone|iPad/i.test(userAgent)
  const isStandalone = useMediaQuery('(display-mode: standalone)', false, {
    getInitialValueInEffect: false,
  })

  if (dismissed || (!isAndroid && !isIOS) || isStandalone || (isIOS && standalone)) return null

  const close = () => {
    if (dontShowAgain) setDismissed(true)
    setOpened(false)
  }

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Добавьте «Рыбспорт РБ» на экран телефона"
      centered
      withCloseButton={false}
      closeOnClickOutside={false}
      closeOnEscape={false}
      styles={{
        title: { fontWeight: 700, lineHeight: 1.25 },
        header: { paddingBottom: 'var(--mantine-spacing-xs)' },
      }}
    >
      <FocusTrap.InitialFocus />
      <Stack gap="md">
        <Text>Если ссылка открылась в мессенджере, откройте сайт в Google Chrome или другом браузере.</Text>
        <Stack component="ol" role="list" gap="xs" m={0} p={0} style={{ listStyle: 'none' }}>
          {(isAndroid ? androidInstallSteps : iosInstallSteps).map(({ label, Icon }, index) => (
            <Box
              component="li"
              key={label}
              style={{
                display: 'grid',
                gridTemplateColumns: '2ch 18px minmax(0, 1fr)',
                gap: 'var(--mantine-spacing-xs)',
                alignItems: 'start',
                lineHeight: 1.45,
              }}
            >
              <span aria-hidden="true">{index + 1}.</span>
              <Box
                component="span"
                aria-hidden="true"
                style={{ display: 'grid', placeItems: 'center', height: '1.45em' }}
              >
                <Icon size={18} />
              </Box>
              <span>{label}</span>
            </Box>
          ))}
        </Stack>
        {isIOS && (
          <Text size="sm">
            Если есть переключатель «Открывать как веб-приложение», включите его перед добавлением.
          </Text>
        )}
        <Stack gap="sm">
          <Button color="signal" size="md" onClick={close}>
            Понятно
          </Button>
          <Checkbox
            label="Больше не показывать"
            checked={dontShowAgain}
            onChange={(event) => setDontShowAgain(event.currentTarget.checked)}
          />
        </Stack>
      </Stack>
    </Modal>
  )
}
