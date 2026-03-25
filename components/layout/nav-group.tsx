import { type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
    type NavCollapsible,
    type NavItem,
    type NavLink,
    type NavGroup as NavGroupProps,
} from './types'
import { usePathname } from 'next/navigation'

function getOrgIdFromPathname(pathname: string): string | null {
    // Expected org-scoped routes:
    // - /:orgId/dash/*
    // - /:orgId/services
    // - /:orgId/settings/*
    const match = pathname.match(/^\/([^/]+)\/(dash|services|settings)(?:\/|$)/)
    return match?.[1] ?? null
}

function resolveOrgHref(href: string, orgId: string | null): string {
    if (!orgId) return href

    // Only rewrite known app routes; keep external/static absolute links intact.
    const orgPrefixes = ['/dash', '/services', '/settings']
    const shouldPrefix = orgPrefixes.some((p) => href === p || href.startsWith(`${p}/`))
    if (!shouldPrefix) return href

    // If the href is already org-prefixed, don't double-prefix.
    if (href.startsWith(`/${orgId}/`)) return href

    return `/${orgId}${href}`
}

export function NavGroup({ title, items }: NavGroupProps) {
    const { state, isMobile } = useSidebar()
    const href = usePathname()
    const orgId = getOrgIdFromPathname(href)
    return (
        <SidebarGroup>
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const key = `${item.title}-${item.url}`

                    if (!item.items)
                        return <SidebarMenuLink key={key} item={item} href={href} orgId={orgId} />

                    if (state === 'collapsed' && !isMobile)
                        return (
                            <SidebarMenuCollapsedDropdown key={key} item={item} href={href} orgId={orgId} />
                        )

                    return <SidebarMenuCollapsible key={key} item={item} href={href} orgId={orgId} />
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

function NavBadge({ children }: { children: ReactNode }) {
    return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

function SidebarMenuLink({
    item,
    href,
    orgId,
}: {
    item: NavLink
    href: string
    orgId: string | null
}) {
    const { setOpenMobile } = useSidebar()
    const resolvedHref =
        typeof item.url === 'string' ? resolveOrgHref(item.url, orgId) : item.url
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={checkIsActive(href, item)}
                tooltip={item.title}
            >
                <Link href={resolvedHref} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

function SidebarMenuCollapsible({
    item,
    href,
    orgId,
}: {
    item: NavCollapsible
    href: string
    orgId: string | null
}) {
    const { setOpenMobile } = useSidebar()
    return (
        <Collapsible
            asChild
            defaultOpen={checkIsActive(href, item, true)}
            className='group/collapsible'
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className='CollapsibleContent'>
                    <SidebarMenuSub>
                        {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={checkIsActive(href, subItem)}
                                >
                                    <Link
                                        href={
                                            typeof subItem.url === 'string'
                                                ? resolveOrgHref(subItem.url, orgId)
                                                : subItem.url
                                        }
                                        onClick={() => setOpenMobile(false)}
                                    >
                                        {subItem.icon && <subItem.icon />}
                                        <span>{subItem.title}</span>
                                        {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

function SidebarMenuCollapsedDropdown({
    item,
    href,
    orgId,
}: {
    item: NavCollapsible
    href: string
    orgId: string | null
}) {
    return (
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={checkIsActive(href, item)}
                    >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side='right' align='start' sideOffset={4}>
                    <DropdownMenuLabel>
                        {item.title} {item.badge ? `(${item.badge})` : ''}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items.map((sub) => (
                        <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
                            <Link
                                href={
                                    typeof sub.url === 'string'
                                        ? resolveOrgHref(sub.url, orgId)
                                        : sub.url
                                }
                                className={`${checkIsActive(href, sub) ? 'bg-primary' : ''}`}
                            >
                                {sub.icon && <sub.icon />}
                                <span className='max-w-52 text-wrap'>{sub.title}</span>
                                {sub.badge && (
                                    <span className='ms-auto text-xs'>{sub.badge}</span>
                                )}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
    const orgScoped = href.match(/^\/[^/]+\/(dash|services|settings)(?:\/|$)/)
    const normalizedHref = orgScoped ? href.replace(/^\/[^/]+/, '') : href

    return (
        normalizedHref === item.url || // /endpint?search=param
        normalizedHref.split('?')[0] === item.url || // endpoint
        !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
        (mainNav &&
            normalizedHref.split('/')[1] !== '' &&
            normalizedHref.split('/')[1] === item?.url?.toString().split('/')[1])
    )
}