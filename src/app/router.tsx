import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
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

import { V2Archive } from '../screens/v2/V2Archive'
import { V2Athlete } from '../screens/v2/V2Athlete'
import { V2Compare } from '../screens/v2/V2Compare'
import { V2Fame } from '../screens/v2/V2Fame'
import { V2Feed } from '../screens/v2/V2Feed'
import { V2Map } from '../screens/v2/V2Map'
import { V2Matrix } from '../screens/v2/V2Matrix'
import { V2Now } from '../screens/v2/V2Now'
import { V2Pair } from '../screens/v2/V2Pair'
import { V2Review } from '../screens/v2/V2Review'
import { V2Schedule } from '../screens/v2/V2Schedule'
import { V2Home, V2Shell } from '../screens/v2/V2Shell'
import { V2Table } from '../screens/v2/V2Table'
import { V2Team } from '../screens/v2/V2Team'
import { V2Teams } from '../screens/v2/V2Teams'
import { V2TournamentFrame } from '../screens/v2/V2TournamentFrame'
import { V2TournamentOutlet } from '../screens/v2/context'
import { HqScreen } from '../screens/staff/HqScreen'
import { TournamentScreen } from '../screens/staff/TournamentScreen'
import { EntriesScreen } from '../screens/staff/EntriesScreen'
import { DrawScreen } from '../screens/staff/DrawScreen'
import { CatchesScreen } from '../screens/staff/CatchesScreen'
import { ConsoleScreen } from '../screens/judge/ConsoleScreen'
import { AdminHubScreen } from '../screens/admin/AdminHubScreen'
import { RolesScreen } from '../screens/admin/RolesScreen'

function RedirectLegacyV2() {
  const { pathname, search, hash } = useLocation()
  const next = pathname.replace(/^\/v2(?=\/|$)/, '/live')
  return <Navigate to={`${next}${search}${hash}`} replace />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'v2', element: <Navigate to="/live" replace /> },
      { path: 'v2/*', element: <RedirectLegacyV2 /> },
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
      {
        path: 'live',
        element: <V2Shell />,
        children: [
          { index: true, element: <V2Home /> },
          { path: 'archive', element: <V2Archive /> },
          { path: 'fame', element: <V2Fame /> },
          { path: 'me', element: <Navigate to="/live" replace /> },
          { path: 'athletes/:athleteId', element: <V2Athlete /> },
          { path: 'teams/:teamId', element: <V2Pair /> },
          {
            path: 't/:tournamentId',
            element: <V2TournamentOutlet />,
            children: [
              { path: 'review', element: <V2Review /> },
              {
                element: <V2TournamentFrame />,
                children: [
                  { index: true, element: <V2Now /> },
                  { path: 'feed', element: <V2Feed /> },
                  { path: 'map', element: <V2Map /> },
                  { path: 'table', element: <V2Table /> },
                  { path: 'matrix', element: <V2Matrix /> },
                  { path: 'schedule', element: <V2Schedule /> },
                  { path: 'teams', element: <V2Teams /> },
                  { path: 'team/:entryId', element: <V2Team /> },
                  { path: 'compare', element: <V2Compare /> },
                ],
              },
            ],
          },
        ],
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
      { path: 'rules', element: <Navigate to="/staff/tournament?tab=rules" replace /> },
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
      { path: 'judges', element: <Navigate to="/staff/tournament?tab=judges" replace /> },
      {
        path: 'catches',
        element: (
          <RoleGuard allow={canManageTournament}>
            <CatchesScreen />
          </RoleGuard>
        ),
      },
      { path: 'finish', element: <Navigate to="/staff/tournament" replace /> },
      { path: 'day', element: <Navigate to="/staff/tournament?tab=schedule" replace /> },
      { path: 'schedule', element: <Navigate to="/staff/tournament?tab=schedule" replace /> },
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
