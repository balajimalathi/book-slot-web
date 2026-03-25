import type { ElementType } from 'react'
import type { LinkProps } from 'next/link'

/** Next.js `<Link href={...}>` — replaces TanStack Router `LinkProps['to']` */
type NavHref = LinkProps['href']

type User = {
  name: string
  email: string
  avatar: string
}

type Team = {
  name: string
  logo: ElementType
  plan: string
}

type BaseNavItem = {
  title: string
  badge?: string
  icon?: ElementType
}

type NavLink = BaseNavItem & {
  url: NavHref
  items?: never
}

export type NavSubItem = BaseNavItem & { url: NavHref }

type NavCollapsible = BaseNavItem & {
  items: NavSubItem[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  title: string
  items: NavItem[]
}

type SidebarData = {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
