import Link from "next/link";
import { ArrowRight, Calendar, CreditCard, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary opacity-20 blur-[100px]" />
      
      <main className="relative z-10 w-full max-w-5xl px-6 py-24 mx-auto text-center flex flex-col items-center gap-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
          <Zap className="w-4 h-4" />
          <span>The modern scheduling platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
          Monetize your time, <br className="hidden md:block" />
          seamlessly.
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground">
          Skndan Cal is your all-in-one platform for scheduling meetings, managing availability, and accepting payments. Say goodbye to back-and-forth emails.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full justify-center">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 text-base font-medium rounded-full w-full sm:w-auto">
              Get Started for Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#features" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium rounded-full w-full bg-background/50 backdrop-blur-sm shadow-sm border-border">
              See How it Works
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-sm font-medium text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Integrated Payments</div>
          <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> Works anywhere</div>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Smart Scheduling</h3>
            <p className="text-muted-foreground text-sm">Set your availability, buffer times, and let clients pick slots that work for both of you automatically.</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Powered by Dodopayments</h3>
            <p className="text-muted-foreground text-sm">Accept payments for your paid services seamlessly using the Dodopayments integration globally.</p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">Instant Confirmation</h3>
            <p className="text-muted-foreground text-sm">Automated email receipts and Google Calendar invites handle all the administrative work for you.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
