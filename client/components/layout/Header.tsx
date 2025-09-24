import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" aria-label="Fortiva home">
          <ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-lg font-extrabold tracking-tight">Fortiva</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <a href="/#features" className="text-sm text-foreground/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5">Features</a>
          <a href="/#compliance" className="text-sm text-foreground/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5">Compliance</a>
          <a href="/#support" className="text-sm text-foreground/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-1 py-0.5">Support</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/app">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/app">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
