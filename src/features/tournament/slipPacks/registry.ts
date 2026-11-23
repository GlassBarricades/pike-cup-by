import type { TournamentFormat } from '../formats/types'
import { BOOR_SLIP_PACK, PIKECUP_SLIP_PACK, type SlipPackCard, type SlipPackId } from './packs'

export type SlipPackMeta = {
  id: SlipPackId | string
  label: string
  cards: SlipPackCard[]
}

const REGISTRY: Record<string, SlipPackMeta> = {
  pikecup: {
    id: 'pikecup',
    label: 'PikeCup (2×5, 70 шт.)',
    cards: PIKECUP_SLIP_PACK,
  },
  boor: {
    id: 'boor',
    label: 'БООР / Западный Кордон (2×3, 52 шт.)',
    cards: BOOR_SLIP_PACK,
  },
}

export function registerSlipPack(meta: SlipPackMeta): void {
  REGISTRY[meta.id] = meta
}

export function listSlipPacks(): SlipPackMeta[] {
  return Object.values(REGISTRY)
}

export function resolveSlipPack(id: string | null | undefined): SlipPackMeta | null {
  if (!id) return null
  return REGISTRY[id] ?? null
}

export function resolveSlipPackForFormat(format: TournamentFormat): SlipPackMeta | null {
  if (format.draw.method === 'none') return null
  const byId = resolveSlipPack(format.draw.slipPackId)
  if (byId) return byId
  // Legacy fallback by draw level
  if (format.draw.level === 'entry') return REGISTRY.pikecup ?? null
  if (format.draw.level === 'athlete') return REGISTRY.boor ?? null
  return null
}
