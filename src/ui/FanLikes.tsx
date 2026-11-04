import { UnstyledButton } from '@mantine/core'
import { IconHeart, IconHeartFilled } from '@tabler/icons-react'

type FanLikesProps = {
  count: number
  active?: boolean
  onToggle?: () => void
  size?: 'xs' | 'sm' | 'md'
  /** Только бейдж без клика */
  readOnly?: boolean
}

/** Яркий счётчик «лайков» / болельщиков. */
export function FanLikes({ count, active = false, onToggle, size = 'sm', readOnly = false }: FanLikesProps) {
  const Icon = active ? IconHeartFilled : count > 0 ? IconHeartFilled : IconHeart
  const iconSize = size === 'md' ? 22 : size === 'xs' ? 13 : 18
  const sizeClass = size === 'md' ? ' pc-fan-likes--md' : size === 'xs' ? ' pc-fan-likes--xs' : ''
  const label = `${count} ${count === 1 ? 'лайк' : count >= 2 && count <= 4 ? 'лайка' : 'лайков'}`

  const body = (
    <>
      <Icon size={iconSize} stroke={1.8} className="pc-fan-likes__icon" aria-hidden />
      <span className="pc-fan-likes__count pc-tabular">{count}</span>
    </>
  )

  if (readOnly || !onToggle) {
    return (
      <span className={`pc-fan-likes${active ? ' pc-fan-likes--on' : ''}${sizeClass}`} title={label}>
        {body}
      </span>
    )
  }

  return (
    <UnstyledButton
      type="button"
      onClick={onToggle}
      className={`pc-fan-likes pc-fan-likes--btn${active ? ' pc-fan-likes--on' : ''}${sizeClass}`}
      aria-pressed={active}
      aria-label={active ? `Вы болеете · ${label}` : `Болеть · ${label}`}
      title={active ? 'Хватит болеть' : 'Болею за них'}
    >
      {body}
    </UnstyledButton>
  )
}
