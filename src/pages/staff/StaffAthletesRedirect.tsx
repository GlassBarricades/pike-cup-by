import { Navigate } from 'react-router-dom'

export function StaffAthletesRedirect() {
  return <Navigate to="/athletes" replace />
}

export function StaffTeamsRedirect() {
  return <Navigate to="/teams" replace />
}
