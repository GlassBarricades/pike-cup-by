import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AuthGuard } from '../components/AuthGuard'
import { RoleGuard } from '../components/RoleGuard'
import { canJudgeDay, canManageTournament } from '../features/auth/permissions'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { ProfilePage } from '../pages/ProfilePage'
import { RegisterPage } from '../pages/RegisterPage'
import { ResultsPage } from '../pages/ResultsPage'
import { TournamentListPage } from '../pages/tournament/TournamentListPage'
import { TournamentHubPage } from '../pages/tournament/TournamentHubPage'
import { RulesPage } from '../pages/tournament/RulesPage'
import { SchedulePage } from '../pages/tournament/SchedulePage'
import { TeamsPage as TournamentTeamsPage } from '../pages/tournament/TeamsPage'
import {
  RedirectLegacyResults,
  RedirectResultsToCurrent,
  RedirectToCurrent,
} from '../pages/tournament/RedirectToCurrent'
import { PeopleHubPage } from '../pages/people/PeopleHubPage'
import { AthletesLayout } from '../pages/people/AthletesLayout'
import { AthletesIndexPage } from '../pages/people/AthletesIndexPage'
import { AthleteDetailPage } from '../pages/people/AthleteDetailPage'
import { TeamsLayout } from '../pages/people/TeamsLayout'
import { TeamsIndexPage } from '../pages/people/TeamsIndexPage'
import { TeamDetailPage } from '../pages/people/TeamDetailPage'
import { StaffLayout } from '../pages/staff/StaffLayout'
import { StaffHubPage } from '../pages/staff/StaffHubPage'
import {
  StaffAthletesRedirect,
  StaffTeamsRedirect,
} from '../pages/staff/StaffAthletesRedirect'
import { StaffEntriesPage } from '../pages/staff/StaffEntriesPage'
import { StaffDrawPage } from '../pages/staff/StaffDrawPage'
import { StaffCatchesPage } from '../pages/staff/StaffCatchesPage'
import { StaffSchedulePage } from '../pages/staff/StaffSchedulePage'
import { StaffRulesPage } from '../pages/staff/StaffRulesPage'
import { StaffTournamentPage } from '../pages/staff/StaffTournamentPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'people', element: <PeopleHubPage /> },
      {
        path: 'athletes',
        element: <AthletesLayout />,
        children: [
          { index: true, element: <AthletesIndexPage /> },
          { path: ':athleteId', element: <AthleteDetailPage /> },
        ],
      },
      {
        path: 'teams',
        element: <TeamsLayout />,
        children: [
          { index: true, element: <TeamsIndexPage /> },
          { path: ':teamId', element: <TeamDetailPage /> },
        ],
      },
      { path: 'tournament', element: <TournamentListPage /> },
      { path: 'tournament/rules', element: <RedirectToCurrent suffix="/rules" /> },
      { path: 'tournament/schedule', element: <RedirectToCurrent suffix="/schedule" /> },
      { path: 'tournament/teams', element: <RedirectToCurrent suffix="/teams" /> },
      { path: 'tournament/:tournamentId', element: <TournamentHubPage /> },
      { path: 'tournament/:tournamentId/results', element: <ResultsPage /> },
      { path: 'tournament/:tournamentId/rules', element: <RulesPage /> },
      { path: 'tournament/:tournamentId/schedule', element: <SchedulePage /> },
      { path: 'tournament/:tournamentId/teams', element: <TournamentTeamsPage /> },
      { path: 'results', element: <RedirectResultsToCurrent /> },
      { path: 'results/:tournamentId', element: <RedirectLegacyResults /> },
      {
        path: 'profile',
        element: (
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        ),
      },
      {
        path: 'staff',
        element: (
          <RoleGuard allow={canJudgeDay}>
            <StaffLayout />
          </RoleGuard>
        ),
        children: [
          { index: true, element: <StaffHubPage /> },
          {
            path: 'athletes',
            element: (
              <RoleGuard allow={canManageTournament}>
                <StaffAthletesRedirect />
              </RoleGuard>
            ),
          },
          {
            path: 'teams',
            element: (
              <RoleGuard allow={canManageTournament}>
                <StaffTeamsRedirect />
              </RoleGuard>
            ),
          },
          {
            path: 'entries',
            element: (
              <RoleGuard allow={canManageTournament}>
                <StaffEntriesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'draw',
            element: (
              <RoleGuard allow={canManageTournament}>
                <StaffDrawPage />
              </RoleGuard>
            ),
          },
          {
            path: 'catches',
            element: <StaffCatchesPage />,
          },
          {
            path: 'schedule',
            element: <StaffSchedulePage />,
          },
          {
            path: 'rules',
            element: (
              <RoleGuard allow={canManageTournament}>
                <StaffRulesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'tournament',
            element: (
              <RoleGuard allow={canManageTournament}>
                <StaffTournamentPage />
              </RoleGuard>
            ),
          },
        ],
      },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
])
