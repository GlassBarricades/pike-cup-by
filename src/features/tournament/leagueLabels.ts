import type { LeagueKind } from './types'

export const LEAGUE_KIND_LABEL: Record<LeagueKind, string> = {
  national: 'Национальная',
  regional: 'Областная',
  other: 'Другая',
}

export const REGION_OPTIONS = [
  { value: 'brest', label: 'Брестская область' },
  { value: 'vitebsk', label: 'Витебская область' },
  { value: 'gomel', label: 'Гомельская область' },
  { value: 'grodno', label: 'Гродненская область' },
  { value: 'minsk', label: 'Минская область' },
  { value: 'mogilev', label: 'Могилёвская область' },
  { value: 'minsk-city', label: 'г. Минск' },
] as const

export function regionLabel(code: string | null | undefined): string | null {
  if (!code) return null
  return REGION_OPTIONS.find((row) => row.value === code)?.label ?? code
}

export function slugifyLeagueName(name: string): string {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'sch',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  }
  return name
    .trim()
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}
