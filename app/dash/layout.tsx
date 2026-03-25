import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/site-header'
import { Main } from '@/components/layout/main'
import { ModeToggle } from '@/components/ui/mode-toggle'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { LayoutProvider } from '@/context/layout-provider'
import { auth } from '@/lib/auth/auth'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect('/login')
  }

  const defaultOpen = getCookie('sidebar_state') !== 'false'

  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        {/* <SkipToMain /> */}
        <AppSidebar
          user={{
            ...session.user,
            image: session.user.image ?? null,
          }}
        />
        <SidebarInset
          className={cn(
            '@container/content',
            'has-data-[layout=fixed]:h-svh'
          )}
        >
          <Header fixed>
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div className="ms-auto flex items-center gap-4">
              <ModeToggle />
            </div>
          </Header>
          <Main fixed>{children}</Main>
        </SidebarInset>
      </SidebarProvider>
    </LayoutProvider>
  )
}
