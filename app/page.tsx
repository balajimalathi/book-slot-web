import { auth } from "@/lib/auth/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { CalendarDays } from "lucide-react";
import LogoutButton from "@/components/auth/logout-button-icon";
export default async function page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <div className="flex relative min-h-screen flex-col bg-background">
      <header className="relative z-20 border-b bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <CalendarDays className="h-6 w-6" />
            <span className="font-bold text-xl tracking-tight">Skndan Cal</span>
          </div>
          <nav className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <ModeToggle />
              {session?.user ? (
                <div className="flex gap-2 items-center">
                  <LogoutButton />
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="rounded-full" variant="ghost">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="rounded-full">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-2xl">
          {session?.user ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                Authenticated
              </h1>
              <p className="mt-2 text-muted-foreground">
                You can manage your sessions and API keys via the API routes:
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  `GET /api/sessions` and `DELETE /api/sessions/:id`
                </div>
                <div>
                  `POST /api/sessions/revoke-all`
                </div>
                <div>
                  `GET /api/api-keys` and `POST /api/api-keys` and{" "}
                  `DELETE /api/api-keys/:id`
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                Sign in to use sessions and API keys
              </h1>
              <p className="mt-2 text-muted-foreground">
                This template is pruned to Better Auth + session management +
                API-key access.
              </p>
            </>
          )}
        </div>
      </main>
      <footer className="w-full z-10 border-t border-border py-6 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0 text-muted-foreground">
            <CalendarDays className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Skndan Cal</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>Powered by Better Auth</span>
          </div>
          <div className="text-sm text-muted-foreground mt-4 md:mt-0">
            © {new Date().getFullYear()} Skndan
          </div>
        </div>
      </footer>
    </div>
  );
}
