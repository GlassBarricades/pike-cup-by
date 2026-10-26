import { Text } from '@mantine/core'

export function ClosedDayNotice() {
  return (
    <Text size="sm" c="dimmed">
      Турнир завершён. Расписание, заявки, жеребьёвка, судьи, пульт и регламент закрыты. Журнал уловов
      можно править. Перезапуск на дату, где день ещё впереди, снова откроет остальное.
    </Text>
  )
}
