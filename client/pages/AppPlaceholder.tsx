import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppPlaceholder() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-sm text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>Secure workspace</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your Fortiva dashboard
        </h1>
        <p className="mt-3 text-muted-foreground">
          This is a placeholder route. Connect Supabase and Builder.io auth to
          enable the full transaction dashboard, MFA, and secure messaging.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Feature icon={<Lock className="h-5 w-5" />} title="MFA required" />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} title="TLS 1.3" />
          <Feature
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Audit logging"
          />
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button>Create transaction</Button>
          <Button variant="outline">Upload document</Button>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="flex items-center gap-2">
        <span className="text-primary" aria-hidden>
          {icon}
        </span>
        <span className="text-sm font-medium">{title}</span>
      </div>
    </div>
  );
}
