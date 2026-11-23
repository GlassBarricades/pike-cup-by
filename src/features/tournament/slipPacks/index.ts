import type { TournamentFormat } from '../formats/types'
import type { SlipPackCard, SlipPackId } from './packs'
import { listSlipPacks, registerSlipPack, resolveSlipPack, resolveSlipPackForFormat } from './registry'

export type { SlipPackCard, SlipPackId, SlipPackSector } from './packs'
export { BOOR_SLIP_PACK, PIKECUP_SLIP_PACK, slipPackById } from './packs'
export { listSlipPacks, registerSlipPack, resolveSlipPack, resolveSlipPackForFormat }

/** Which printed pack belongs to this format (null = жеребьёвка без бумажек). */
export function slipPackIdForFormat(format: TournamentFormat): SlipPackId | null {
  const meta = resolveSlipPackForFormat(format)
  if (!meta) return null
  if (meta.id === 'pikecup' || meta.id === 'boor') return meta.id
  return null
}

export function slipPackForFormat(format: TournamentFormat): SlipPackCard[] | null {
  return resolveSlipPackForFormat(format)?.cards ?? null
}

export function slipPackLabel(id: SlipPackId | string): string {
  return resolveSlipPack(id)?.label ?? String(id)
}
