import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Button, buttonVariants } from "@falcon-framework/ui/components/button";
import { Checkbox } from "@falcon-framework/ui/components/checkbox";
import { Label } from "@falcon-framework/ui/components/label";
import { Skeleton } from "@falcon-framework/ui/components/skeleton";
import { Separator } from "@falcon-framework/ui/components/separator";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useConnectClient } from "@/hooks/use-connect-client";
import type { AppItem } from "@/lib/connect-client";

export const Route = createFileRoute("/_authed/connections/new")({
  validateSearch: z.object({ sourceAppId: z.string().optional() }),
  component: NewConnectionPage,
});

const STEPS = ["source", "target", "scopes", "review"] as const;
type Step = (typeof STEPS)[number];

function NewConnectionPage() {
  const { sourceAppId: preselectedSourceId } = useSearch({
    from: "/_authed/connections/new",
  });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const client = useConnectClient();

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const [step, setStep] = useState<Step>("source");
  const [sourceApp, setSourceApp] = useState<AppItem | null>(
    appsQuery.data?.find((a) => a.id === preselectedSourceId) ?? null,
  );
  const [targetApp, setTargetApp] = useState<AppItem | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set());

  const targetCapabilitiesQuery = useQuery({
    queryKey: ["capabilities", targetApp?.id],
    queryFn: () => client!.apps.capabilities(targetApp!.id),
    enabled: !!client && !!targetApp,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      client!.installationRequests.create({
        sourceAppId: sourceApp!.id,
        targetAppId: targetApp!.id,
        requestedScopes: Array.from(selectedScopes),
      }),
    retry: 1,
    onSuccess: () => {
      toast.success("Request submitted. Approve it on Connections to create the connection.");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["installation-requests"] });
      navigate({ to: "/connections" });
    },
    onError: (e) => toast.error(e.message),
  });

  const apps = appsQuery.data ?? [];
  const activeApps = apps.filter((a) => a.status === "active");
  const stepIndex = STEPS.indexOf(step);

  const canProceed =
    (step === "source" && !!sourceApp) ||
    (step === "target" && !!targetApp) ||
    (step === "scopes" && selectedScopes.size > 0) ||
    step === "review";

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  }

  return (
    <div className="max-w-xl space-y-6">
      <Link
        to="/connections"
        className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2"}
      >
        <ArrowLeft className="h-4 w-4" />
        Connections
      </Link>

      <div>
        <h1 className="text-2xl font-bold">New Connection</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect two apps to enable data sharing
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                i < stepIndex
                  ? "bg-primary text-primary-foreground"
                  : i === stepIndex
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < stepIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 transition-all ${i < stepIndex ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
        >
          {step === "source" && (
            <AppSelector
              title="Source App"
              description="The app requesting access"
              apps={activeApps}
              selected={sourceApp}
              onSelect={setSourceApp}
              exclude={targetApp?.id}
              isLoading={appsQuery.isLoading}
            />
          )}
          {step === "target" && (
            <AppSelector
              title="Target App"
              description="The app granting access"
              apps={activeApps}
              selected={targetApp}
              onSelect={setTargetApp}
              exclude={sourceApp?.id}
              isLoading={appsQuery.isLoading}
            />
          )}
          {step === "scopes" && (
            <ScopesSelector
              targetApp={targetApp!}
              capabilities={targetCapabilitiesQuery.data ?? []}
              isLoading={targetCapabilitiesQuery.isLoading}
              selected={selectedScopes}
              onChange={setSelectedScopes}
            />
          )}
          {step === "review" && (
            <ReviewStep
              sourceApp={sourceApp!}
              targetApp={targetApp!}
              scopes={Array.from(selectedScopes)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} disabled={stepIndex === 0}>
          Back
        </Button>
        {step === "review" ? (
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              "Create connection request"
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={!canProceed}>
            Next <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function AppSelector({
  title,
  description,
  apps,
  selected,
  onSelect,
  exclude,
  isLoading,
}: {
  title: string;
  description: string;
  apps: AppItem[];
  selected: AppItem | null;
  onSelect: (app: AppItem) => void;
  exclude?: string;
  isLoading: boolean;
}) {
  const available = apps.filter((a) => a.id !== exclude);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No apps available</p>
        ) : (
          available.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => onSelect(app)}
              className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all hover:border-primary/50 hover:bg-muted/30 ${
                selected?.id === app.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted font-bold text-xs">
                {app.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{app.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {app.description ?? app.slug}
                </div>
              </div>
              {selected?.id === app.id && (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ScopesSelector({
  targetApp,
  capabilities,
  isLoading,
  selected,
  onChange,
}: {
  targetApp: AppItem;
  capabilities: { id: string; scopeKey: string; description: string | null }[];
  isLoading: boolean;
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  function toggle(scopeKey: string) {
    const next = new Set(selected);
    if (next.has(scopeKey)) next.delete(scopeKey);
    else next.add(scopeKey);
    onChange(next);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Request Scopes</CardTitle>
        <CardDescription>
          Select what permissions to request from{" "}
          <span className="text-foreground font-medium">{targetApp.name}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)
        ) : capabilities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No capabilities defined for this app
          </p>
        ) : (
          capabilities.map((cap) => (
            <div
              key={cap.id}
              className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => toggle(cap.scopeKey)}
            >
              <Checkbox
                id={cap.id}
                checked={selected.has(cap.scopeKey)}
                onCheckedChange={() => toggle(cap.scopeKey)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor={cap.id} className="cursor-pointer">
                  <code className="text-xs font-mono text-primary bg-muted rounded px-1.5 py-0.5">
                    {cap.scopeKey}
                  </code>
                </Label>
                {cap.description && (
                  <p className="text-xs text-muted-foreground mt-1">{cap.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  sourceApp,
  targetApp,
  scopes,
}: {
  sourceApp: AppItem;
  targetApp: AppItem;
  scopes: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review Connection</CardTitle>
        <CardDescription>Confirm the connection details before creating</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-lg bg-muted p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Source</div>
            <div className="font-semibold">{sourceApp.name}</div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex-1 rounded-lg bg-muted p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Target</div>
            <div className="font-semibold">{targetApp.name}</div>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Requested scopes</p>
          {scopes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scopes selected</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {scopes.map((s) => (
                <code key={s} className="rounded bg-muted px-2 py-1 text-xs font-mono text-primary">
                  {s}
                </code>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
