import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { CalendarDays } from "lucide-react";

export default async function page() {
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
              <Link href="/login">
                <Button className="rounded-full" variant="ghost">
                  Admin login
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="rounded-full">List your business</Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Book appointments with trusted providers
            </h1>
            <p className="text-muted-foreground">
              Find your provider and book in minutes. Public booking pages are
              available via short links like <code>/acme-inc</code>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/book/demo-org">
                <Button>Try demo booking page</Button>
              </Link>
              <Link href="/onboarding">
                <Button variant="outline">Create your booking page</Button>
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium">How it works</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>1. Open your provider link (example: /acme-inc)</li>
              <li>2. Select service, staff, date, and slot</li>
              <li>3. Confirm details and continue to payment</li>
              <li>4. Receive booking confirmation instantly</li>
            </ul>
          </div>
        </div>
      </main>
      <footer className="w-full z-10 border-t border-border py-6 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0 text-muted-foreground">
            <CalendarDays className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Skndan Cal</span>
          </div>
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>Public booking experience</span>
          </div>
          <div className="text-sm text-muted-foreground mt-4 md:mt-0">
            © {new Date().getFullYear()} Skndan
          </div>
        </div>
      </footer>
    </div>
  );
}
