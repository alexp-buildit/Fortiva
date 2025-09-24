export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Fortiva, Inc. All rights reserved.
          </p>
          <nav className="flex items-center gap-6" aria-label="Footer">
            <a
              href="/#support"
              className="text-sm text-foreground/80 hover:text-foreground"
            >
              Support
            </a>
            <a
              href="#"
              className="text-sm text-foreground/80 hover:text-foreground"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-foreground/80 hover:text-foreground"
            >
              Terms
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
