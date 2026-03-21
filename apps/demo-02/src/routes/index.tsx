import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">Falcon demo — target application</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl leading-[1.02] font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          Approve connections here
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          This app runs on port 3011. When the source app (3010) starts a Falcon Connect
          installation, your browser opens this app to sign in (same Falcon Auth user) and approve
          the pending request.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/connections"
            className="rounded-full border border-[rgba(176,58,66,0.3)] bg-[rgba(224,93,77,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline transition hover:-translate-y-0.5 hover:bg-[rgba(224,93,77,0.24)]"
          >
            View connections
          </Link>
          <Link
            to="/sign-in"
            className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5 hover:bg-[var(--link-bg-hover)]"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
