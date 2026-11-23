import { supabase } from '../../lib/supabase'
import { parseFormat, parseFormatStrict } from '../tournament/formats'
import type { FormatPreset, FormatPresetInput } from './types'

const PRESET_SELECT =
  'id, slug, name, description, format, is_system, archived_at, created_by, created_at, updated_at'

function asPreset(row: Record<string, unknown>): FormatPreset {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ''),
    format: parseFormat(row.format),
    is_system: Boolean(row.is_system),
    archived_at: (row.archived_at as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }
}

export async function fetchFormatPresets(options?: {
  includeArchived?: boolean
}): Promise<FormatPreset[]> {
  let query = supabase.from('format_presets').select(PRESET_SELECT).order('name')
  if (!options?.includeArchived) {
    query = query.is('archived_at', null)
  }
  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((row) => asPreset(row as Record<string, unknown>))
}

export async function fetchFormatPresetById(id: string): Promise<FormatPreset | null> {
  const { data, error } = await supabase.from('format_presets').select(PRESET_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  return asPreset(data as Record<string, unknown>)
}

export async function fetchFormatPresetBySlug(slug: string): Promise<FormatPreset | null> {
  const { data, error } = await supabase
    .from('format_presets')
    .select(PRESET_SELECT)
    .eq('slug', slug)
    .is('archived_at', null)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return asPreset(data as Record<string, unknown>)
}

export async function createFormatPreset(input: FormatPresetInput): Promise<FormatPreset> {
  const format = parseFormatStrict(input.format)
  const { data, error } = await supabase
    .from('format_presets')
    .insert({
      slug: input.slug.trim(),
      name: input.name.trim(),
      description: input.description?.trim() ?? '',
      format,
      is_system: false,
    })
    .select(PRESET_SELECT)
    .single()
  if (error) throw error
  return asPreset(data as Record<string, unknown>)
}

export async function updateFormatPreset(
  id: string,
  patch: Partial<FormatPresetInput> & { archive?: boolean },
): Promise<FormatPreset> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name != null) payload.name = patch.name.trim()
  if (patch.slug != null) payload.slug = patch.slug.trim()
  if (patch.description != null) payload.description = patch.description.trim()
  if (patch.format != null) payload.format = parseFormatStrict(patch.format)
  if (patch.archive === true) payload.archived_at = new Date().toISOString()
  if (patch.archive === false) payload.archived_at = null

  const { data, error } = await supabase
    .from('format_presets')
    .update(payload)
    .eq('id', id)
    .select(PRESET_SELECT)
    .single()
  if (error) throw error
  return asPreset(data as Record<string, unknown>)
}

export async function duplicateFormatPreset(
  id: string,
  options?: { slug?: string; name?: string },
): Promise<FormatPreset> {
  const source = await fetchFormatPresetById(id)
  if (!source) throw new Error('Пресет не найден')
  const slug = options?.slug ?? `${source.slug}-copy-${Date.now().toString(36)}`
  const name = options?.name ?? `${source.name} (копия)`
  return createFormatPreset({
    slug,
    name,
    description: source.description,
    format: source.format,
  })
}

/** Shallow field paths that differ between two formats (for “changed vs preset” badge). */
export function diffFormatPaths(
  a: unknown,
  b: unknown,
  prefix = '',
): string[] {
  if (Object.is(a, b)) return []
  if (a == null || b == null || typeof a !== typeof b) return [prefix || '(root)']
  if (typeof a !== 'object') return a === b ? [] : [prefix || '(root)']
  if (Array.isArray(a) && Array.isArray(b)) {
    if (JSON.stringify(a) === JSON.stringify(b)) return []
    return [prefix || '(root)']
  }
  const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)])
  const paths: string[] = []
  for (const key of keys) {
    const next = prefix ? `${prefix}.${key}` : key
    paths.push(
      ...diffFormatPaths(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        next,
      ),
    )
  }
  return paths
}
