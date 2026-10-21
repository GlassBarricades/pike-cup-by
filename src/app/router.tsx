import { createBrowserRouter, Navigate } from 'react-router-dom'
import {
  canJudgeDay,
  canManageRoles,
  canManageTournament,
} from '../features/auth/permissions'
import { AuthGuard } from '../layouts/AuthGuard'
import { RoleGuard } from '../layouts/RoleGuard'
import { PublicLayout } from '../layouts/PublicLayout'
import { StaffLayout } from '../layouts/StaffLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { JudgeLayout } from '../layouts/JudgeLayout'

import { HomeScreen } from '../screens/public/HomeScreen'
import { LiveScreen } from '../screens/public/LiveScreen'
import { EventScreen } from '../screens/public/EventScreen'
import { TeamLiveScreen } from '../screens/public/TeamLiveScreen'
import { LeaderboardScreen } from '../screens/public/LeaderboardScreen'
import { RulesScreen } from '../screens/public/RulesScreen'
import { ArchiveScreen } from '../screens/public/ArchiveScreen'
import { PeopleHubScreen } from '../screens/public/PeopleHubScreen'
import { AthletesLayout } from '../screens/public/AthletesLayout'
import { AthletesIndexScreen } from '../screens/public/AthletesIndexScreen'
import { AthleteDetailScreen } from '../screens/public/AthleteDetailScreen'
import { TeamsLayout } from '../screens/public/TeamsLayout'
import { TeamsIndexScreen } from '../screens/public/TeamsIndexScreen'
import { TeamDetailScreen } from '../screens/public/TeamDetailScreen'
import { ProfileScreen } from '../screens/public/ProfileScreen'
import { LoginScreen } from '../screens/public/LoginScreen'
import { RegisterScreen } from '../screens/public/RegisterScreen'
import {
  RedirectLegacyResults,
  RedirectResultsToCurrent,
  RedirectToCurrent,
  RedirectToTab,
} from '../screens/public/Redirects'

import { HqScreen } from '../screens/staff/HqScreen'
import { DayScreen } from '../screens/staff/DayScreen'
import { TournamentScreen } from '../screens/staff/TournamentScreen'
import { RulesEditScreen } from '../screens/staff/RulesEditScreen'
import { EntriesScreen } from '../screens/staff/EntriesScreen'
import { DrawScreen } from '../screens/staff/DrawScreen'
import { JudgesScreen } from '../screens/staff/JudgesScreen'
import { CatchesScreen } from '../screens/staff/CatchesScreen'
import { FinishScreen } from '../screens/staff/FinishScreen'
import { ConsoleScreen } from '../screens/judge/ConsoleScreen'
import { AdminHubScreen } from '../screens/admin/AdminHubScreen'
import { RolesScreen } from '../screens/admin/RolesScreen'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'live', element: <LiveScreen /> },
      { path: 'people', element: <PeopleHubScreen /> },
      {
        path: 'athletes',
        element: <AthletesLayout />,
        children: [
          { index: true, element: <AthletesIndexScreen /> },
          { path: ':athleteId', element: <AthleteDetailScreen /> },
        ],
      },
      {
        path: 'teams',
        element: <TeamsLayout />,
        children: [
          { index: true, element: <TeamsIndexScreen /> },
          { path: ':teamId', element: <TeamDetailScreen /> },
        ],
      },
      { path: 'tournament', element: <ArchiveScreen /> },
      { path: 'tournament/rules', element: <RedirectToCurrent suffix="?tab=rules" /> },
      { path: 'tournament/schedule', element: <RedirectToCurrent suffix="?tab=schedule" /> },
      { path: 'tournament/teams', element: <RedirectToCurrent suffix="?tab=teams" /> },
      { path: 'tournament/:tournamentId', element: <EventScreen /> },
      { path: 'tournament/:tournamentId/team/:entryId', element: <TeamLiveScreen /> },
      { path: 'tournament/:tournamentId/results', element: <LeaderboardScreen /> },
      { path: 'tournament/:tournamentId/rules', element: <RulesScreen /> },
      {
        path: 'tournament/:tournamentId/schedule',
        element: <RedirectToTab tab="schedule" />,
      },
      {
        path: 'tournament/:tournamentId/teams',
        element: <RedirectToTab tab="teams" />,
      },
      { path: 'results', element: <RedirectResultsToCurrent /> },
      { path: 'results/:tournamentId', element: <RedirectLegacyResults /> },
      {
        path: 'profile',
        element: (
          <AuthGuard>
            <ProfileScreen />
          </AuthGuard>
        ),
      },
    ],
  },
  {
    path: '/staff',
    element: (
      <RoleGuard allow={canJudgeDay}>
        <StaffLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <HqScreen /> },
      {
        path: 'tournament',
        element: (
          <RoleGuard allow={canManageTournament}>
            <TournamentScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'rules',
        element: (
          <RoleGuard allow={canManageTournament}>
            <RulesEditScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'entries',
        element: (
          <RoleGuard allow={canManageTournament}>
            <EntriesScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'draw',
        element: (
          <RoleGuard allow={canManageTournament}>
            <DrawScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'judges',
        element: (
          <RoleGuard allow={canManageTournament}>
            <JudgesScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'catches',
        element: (
          <RoleGuard allow={canManageTournament}>
            <CatchesScreen />
          </RoleGuard>
        ),
      },
      {
        path: 'finish',
        element: (
          <RoleGuard allow={canManageTournament}>
            <FinishScreen />
          </RoleGuard>
        ),
      },
      { path: 'day', element: <DayScreen /> },
      { path: 'schedule', element: <Navigate to="/staff/day" replace /> },
      { path: 'athletes', element: <Navigate to="/athletes" replace /> },
      { path: 'teams', element: <Navigate to="/teams" replace /> },
      { path: 'admin', element: <Navigate to="/admin" replace /> },
      { path: 'roles', element: <Navigate to="/admin/roles" replace /> },
    ],
  },
  {
    path: '/staff/console',
    element: (
      <RoleGuard allow={canJudgeDay}>
        <JudgeLayout />
      </RoleGuard>
    ),
    children: [{ index: true, element: <ConsoleScreen /> }],
  },
  {
    path: '/admin',
    element: (
      <RoleGuard allow={canManageRoles}>
        <AdminLayout />
      </RoleGuard>
    ),
    children: [
      { index: true, element: <AdminHubScreen /> },
      { path: 'roles', element: <RolesScreen /> },
    ],
  },
  { path: '/login', element: <LoginScreen /> },
  { path: '/register', element: <RegisterScreen /> },
])
