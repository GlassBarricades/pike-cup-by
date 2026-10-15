export type AppRole = 'participant' | 'judge' | 'organizer' | 'admin'

export type Profile = {
  id: string
  full_name: string | null
  role: AppRole
}
