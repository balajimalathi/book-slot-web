"use client";

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

interface BreadcrumbItemType {
    title: string
    href: string
    isLast: boolean
}

export function NavBreadcrumb({ className }: { className?: string }) {
    const pathname = usePathname()

    const segments = React.useMemo(
        () => pathname.split("/").filter(Boolean),
        [pathname]
    )

    if (segments.length === 0) {
        return null
    }

    const breadcrumbs: BreadcrumbItemType[] = []
    let hrefAccumulator = ""

    for (let i = 0; i < segments.length; i++) {
        hrefAccumulator += `/${segments[i]}`
        const isLast = i === segments.length - 1
        const raw = segments[i]
        const title =
            raw.charAt(0).toUpperCase() + raw.slice(1).replace(/-/g, " ")

        breadcrumbs.push({
            title,
            href: hrefAccumulator,
            isLast,
        })
    }

    return (
        <Breadcrumb className={cn(className)}>
            <BreadcrumbList className="flex-nowrap">
                {breadcrumbs.map((item) => (
                    <React.Fragment key={item.href}>
                        <BreadcrumbItem>
                            {!item.isLast ? (
                                <BreadcrumbLink asChild>
                                    <Link href={item.href}>{item.title}</Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{item.title}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                        {!item.isLast && <BreadcrumbSeparator />}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
