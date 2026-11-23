import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFormatPreset,
  duplicateFormatPreset,
  fetchFormatPresetById,
  fetchFormatPresets,
  updateFormatPreset,
} from './api'
import type { FormatPresetInput } from './types'

export const formatPresetsQueryKey = ['format-presets'] as const

export function useFormatPresets(options?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: [...formatPresetsQueryKey, options?.includeArchived ? 'all' : 'active'],
    queryFn: () => fetchFormatPresets(options),
  })
}

export function useFormatPreset(id: string | undefined) {
  return useQuery({
    queryKey: [...formatPresetsQueryKey, id],
    queryFn: () => fetchFormatPresetById(id!),
    enabled: Boolean(id),
  })
}

export function useCreateFormatPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: FormatPresetInput) => createFormatPreset(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: formatPresetsQueryKey })
    },
  })
}

export function useUpdateFormatPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; patch: Partial<FormatPresetInput> & { archive?: boolean } }) =>
      updateFormatPreset(args.id, args.patch),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: formatPresetsQueryKey })
    },
  })
}

export function useDuplicateFormatPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; slug?: string; name?: string }) =>
      duplicateFormatPreset(args.id, args),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: formatPresetsQueryKey })
    },
  })
}
