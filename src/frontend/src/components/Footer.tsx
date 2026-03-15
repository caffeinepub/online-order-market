export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p className="font-display text-base font-medium text-foreground">
            Online Order Market
          </p>
          <p>
            Created by{" "}
            <span className="font-semibold text-foreground">ycdom</span>{" "}
            &nbsp;|&nbsp; © {year}. Built with ❤️ using Caffeine
          </p>
        </div>
      </div>
    </footer>
  );
}
