import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useFalconAuth } from "@falcon-framework/sdk/react";
import { useState } from "react";

export const Route = createFileRoute("/org/create")({
  component: CreateOrgPage,
});

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function CreateOrgPage() {
  const navigate = useNavigate();
  const { client, isLoaded, isSignedIn } = useFalconAuth();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoaded && !isSignedIn) {
    void navigate({ to: "/sign-in" });
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const s = slug.trim() || slugify(name);
    if (name.trim().length < 2 || s.length < 2) {
      setError("Name and slug must be at least 2 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await client.organization.create({
        name: name.trim(),
        slug: s,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not create organization");
        return;
      }
      const id = result.data?.id;
      if (id) {
        localStorage.setItem("falcon-demo01:activeOrgId", id);
        await client.organization.setActive({ organizationId: id });
      }
      await navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-wrap px-4 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-8 shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-[var(--sea-ink)]">Create a workspace</h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Falcon Connect needs an organization context. Create one to continue the demo.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="org-name"
              className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
            >
              Workspace name
            </label>
            <input
              id="org-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
              required
              minLength={2}
            />
          </div>
          <div>
            <label
              htmlFor="org-slug"
              className="mb-1 block text-sm font-medium text-[var(--sea-ink)]"
            >
              Slug
            </label>
            <input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-lg border border-[var(--line)] bg-transparent px-3 py-2 text-sm"
              required
              minLength={2}
              pattern="[a-z0-9-]+"
            />
          </div>
          {error ? <p className="text-sm text-[var(--destructive)]">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[var(--lagoon)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>
    </main>
  );
}
