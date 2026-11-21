import type { TournamentFormat } from '../formats/types'
import { BOOR_SLIP_PACK, PIKECUP_SLIP_PACK, type SlipPackCard, type SlipPackId } from './packs'

export type { SlipPackCard, SlipPackId, SlipPackSector } from './packs'
export { BOOR_SLIP_PACK, PIKECUP_SLIP_PACK, slipPackById } from './packs'

/** Which printed pack belongs to this format (null = жеребьёвка без бумажек). */
export function slipPackIdForFormat(format: TournamentFormat): SlipPackId | null {
    if (format.draw === 'pikecup_slips') return 'pikecup'
    if (format.draw === 'per_athlete_sectors') return 'boor'
    return null
}

export function slipPackForFormat(format: TournamentFormat): SlipPackCard[] | null {
    const id = slipPackIdForFormat(format)
    if (!id) return null
    return id === 'pikecup' ? PIKECUP_SLIP_PACK : BOOR_SLIP_PACK
}

export function slipPackLabel(id: SlipPackId): string {
    return id === 'pikecup' ? 'PikeCup (2×5, 70 шт.)' : 'БООР / Западный Кордон (2×3, 52 шт.)'
}
