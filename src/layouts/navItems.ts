import { IconAntennaBars5, IconArchive, IconDeviceGamepad2, IconHome, IconUserCircle, IconUsersGroup, type Icon } from '@tabler/icons-react'
import type { AppRole } from '../features/auth/types'

export type NavItem = {
    to: string
    label: string
    icon: Icon
    /** Пункт, который судья должен заметить сразу после входа. */
    accent?: boolean
    /** Красный мерцающий пункт идущего турнира. */
    pulse?: boolean
}

export function getNavItems(role?: AppRole | null, options?: { live?: boolean }): NavItem[] {
    const items: NavItem[] = [{ to: '/', label: 'Главная', icon: IconHome }]
    if (options?.live) {
        items.push({ to: '/live', label: 'LIVE', icon: IconAntennaBars5, pulse: true })
    }
    items.push(
        { to: '/tournament', label: 'Турниры', icon: IconArchive },
        { to: '/people', label: 'Участники', icon: IconUsersGroup },
        { to: '/profile', label: 'Профиль', icon: IconUserCircle },
    )
    if (role === 'judge') {
        return [{ to: '/staff/console', label: 'Пульт', icon: IconDeviceGamepad2, accent: true }, ...items]
    }
    return items
}

export function isNavActive(pathname: string, to: string) {
    if (to === '/') {
        return pathname === '/'
    }
    if (to === '/tournament') {
        return pathname === '/tournament' || pathname.startsWith('/tournament/')
    }
    if (to === '/people') {
        return pathname === '/people' || pathname.startsWith('/athletes') || pathname.startsWith('/teams')
    }
    if (to === '/profile') {
        return pathname === '/profile'
    }
    if (to === '/live') {
        return pathname === '/live'
    }
    return pathname === to || pathname.startsWith(`${to}/`)
}
