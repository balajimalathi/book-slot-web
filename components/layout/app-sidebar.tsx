'use client'

import type { ComponentProps } from 'react'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { User } from '@/lib/db/db'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export type AppSidebarProps = ComponentProps<typeof Sidebar> & {
  /** When set (e.g. from server session), overrides static sidebar user in the footer */
  user?: Partial<User>
}

export function AppSidebar({
  user,
  collapsible: collapsibleProp,
  variant: variantProp,
  className,
  ...rest
}: AppSidebarProps) {
  const { collapsible: layoutCollapsible, variant: layoutVariant } = useLayout()
  return (
    <Sidebar
      collapsible={collapsibleProp ?? layoutCollapsible}
      variant={variantProp ?? layoutVariant}
      className={className}
      {...rest}
    >
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
        {/* Swap TeamSwitcher for <AppTitle /> if you prefer a static title (shadcn-admin pattern). */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            user ?? {
              name: sidebarData.user.name,
              email: sidebarData.user.email,
              image: sidebarData.user.avatar,
            }
          }
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
