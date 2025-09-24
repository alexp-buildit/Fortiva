import { useEffect, useState } from "react";
import { DemoResponse } from "@shared/api";
import { Button } from "@/components/ui/button";
import {
  Lock,
  ShieldCheck,
  Link as LinkIcon,
  FileSignature,
  MessageSquareLock,
  Download,
  CheckCircle2,
  Fingerprint,
  TimerReset,
} from "lucide-react";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  useEffect(() => {
    fetchDemo();
  }, []);

  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      // Intentionally ignore demo errors
    }
  };

  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <Compliance />
      <Support />
      <section aria-hidden className="sr-only">{exampleFromServer}</section>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent"
        aria-hidden
      />
      <div className="container py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-card-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>Fortiva Platform</span>
          </div>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Eliminate wire fraud in commercial real estate.
          </h1>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            Secure, authenticated communication with multi-factor verification
            for wire transfer instructions. Built for title companies, escrow
            agents, and legal teams.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <a href="/app">Get started</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="/#support">Request a demo</a>
            </Button>
          </div>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              TLS 1.3 end-to-end
            </li>
            <li className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              AES-256 at rest
            </li>
            <li className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              MFA for sensitive actions
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: <Lock className="h-5 w-5" />,
      title: "Authenticated access",
      desc:
        "MFA on account access and when viewing or changing wire instructions.",
    },
    {
      icon: <LinkIcon className="h-5 w-5" />,
      title: "Time-limited secure links",
      desc:
        "Encrypted URLs that expire automatically with transaction context.",
    },
    {
      icon: <FileSignature className="h-5 w-5" />,
      title: "Tamper-evident instructions",
      desc:
        "Integrity checksums and periodic verification on stored banking data.",
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: "Download receipts",
      desc:
        "Automatic logging and notifications when senders download instructions.",
    },
    {
      icon: <MessageSquareLock className="h-5 w-5" />,
      title: "Secure messaging",
      desc:
        "Transaction-scoped messaging with real-time delivery and audit trail.",
    },
    {
      icon: <Fingerprint className="h-5 w-5" />,
      title: "Role-based workspaces",
      desc:
        "Clear interfaces for Admins, Senders, and Receivers with proper permissions.",
    },
  ];

  return (
    <section id="features" className="container py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for high-stakes transactions
        </h2>
        <p className="mt-3 text-muted-foreground">
          Fortiva combines strong encryption, access control, and compliance-first
          workflows to prevent wire fraud and simplify audits.
        </p>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((f) => (
          <article
            key={f.title}
            className="group rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition hover:shadow-md focus-within:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {f.icon}
              </span>
              <h3 className="text-base font-semibold">{f.title}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 rounded-lg border bg-secondary/40 p-6 text-secondary-foreground">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold">Ready to see it in action?</h3>
            <p className="text-sm text-muted-foreground">
              Launch the secure workspace and explore the dashboard placeholder.
            </p>
          </div>
          <Button asChild>
            <a href="/app">Open workspace</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function Compliance() {
  const items = [
    { title: "TLS 1.3 in transit" },
    { title: "AES-256 at rest" },
    { title: "SOC 2-aligned storage" },
    { title: "MFA on sensitive actions" },
    { title: "Role-based timeouts" },
    { title: "Comprehensive audit trails" },
    { title: "Export: PDF, CSV, Excel" },
    { title: "Utah BSA/AML support" },
    { title: "Incident response within 15 min" },
  ];
  return (
    <section id="compliance" className="bg-muted/30 py-16 sm:py-24">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Compliance & Security</h2>
          <p className="mt-3 text-muted-foreground">
            Enterprise-grade controls to meet stringent regulatory requirements while
            keeping your team productive.
          </p>
        </div>
        <ul className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.title} className="flex items-center gap-2 rounded-lg border bg-card p-3 text-card-foreground">
              <TimerReset className="h-4 w-4 text-primary" aria-hidden />
              <span className="text-sm">{i.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Support() {
  return (
    <section id="support" className="container py-16 sm:py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">We’re here to help</h2>
          <p className="mt-3 text-muted-foreground">
            Have questions, need a demo, or want help setting up Supabase and MFA? Our
            team will guide you through best practices to eliminate wire fraud risk.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p><span className="font-medium">Email:</span> support@fortiva.example</p>
            <p><span className="font-medium">Hours:</span> Mon–Fri, 8am–6pm MT</p>
            <p className="text-muted-foreground">For expired secure links, contact support to reissue access.</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h3 className="text-lg font-semibold">Request a demo</h3>
          <p className="mt-1 text-sm text-muted-foreground">We’ll reach out shortly to coordinate.</p>
          <form className="mt-4 grid gap-3" onSubmit={(e) => e.preventDefault()} aria-label="Demo request form">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Work email</span>
              <input
                type="email"
                required
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Company</span>
              <input
                type="text"
                required
                className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium">Role</span>
              <select className="h-10 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option>Admin / Escrow</option>
                <option>Sender</option>
                <option>Receiver</option>
                <option>Compliance</option>
              </select>
            </label>
            <Button type="submit" className="mt-2">Submit</Button>
            <p className="text-xs text-muted-foreground">Submitting the form is a visual demo only.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
