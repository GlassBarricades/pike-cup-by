import type { DrawSlip } from './types'

export function formatSlipCode(code: string): string {
  return `№ ${code}`
}

export function slipSector(
  slip: Pick<DrawSlip, 'sectors'> | null | undefined,
  tour: 1 | 2,
  mini: number,
): number | null {
  const row = slip?.sectors?.find((sector) => sector.tour_number === tour && sector.mini_number === mini)
  return row?.sector_number ?? null
}

export function slipOptionLabel(slip: Pick<DrawSlip, 'code' | 'start_zone'>): string {
  return `${formatSlipCode(slip.code)} · старт ${slip.start_zone}`
}
