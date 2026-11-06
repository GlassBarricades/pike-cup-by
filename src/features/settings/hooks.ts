import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAppSettings, updateHideRegistration } from './api'

export const settingsKeys = {
  app: ['appSettings'] as const,
}

export function useAppSettings() {
  return useQuery({
    queryKey: settingsKeys.app,
    queryFn: fetchAppSettings,
    staleTime: 60_000,
  })
}

export function useUpdateHideRegistration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateHideRegistration,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.app, data)
    },
  })
}
