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

/** Стартовый сектор I тура (мини-тур 1) — удобно узнавать бумажку без напечатанного номера. */
export function slipFirstTourSector(slip: Pick<DrawSlip, 'sectors'> | null | undefined): number | null {
  return slipSector(slip, 1, 1)
}

export function slipOptionLabel(slip: Pick<DrawSlip, 'code' | 'start_zone' | 'sectors'>): string {
  const first = slipFirstTourSector(slip)
  const firstPart = first != null ? ` · I тур сектор ${first}` : ''
  return `${formatSlipCode(slip.code)} · старт ${slip.start_zone}${firstPart}`
}
