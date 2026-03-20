import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Badge } from "@falcon-framework/ui/components/badge";
import { buttonVariants } from "@falcon-framework/ui/components/button";
import { Skeleton } from "@falcon-framework/ui/components/skeleton";
import { Button } from "@falcon-framework/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@falcon-framework/ui/components/tabs";
import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  Loader2,
  Plug,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

import type { AppItem, ConnectionItem, InstallationRequestItem } from "@/lib/connect-client";
import { useConnectClient } from "@/hooks/use-connect-client";
import { useActiveOrg } from "@/providers/active-org";

export const Route = createFileRoute("/_authed/connections/")({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { activeOrg } = useActiveOrg();
  const { location } = useRouterState();
  const client = useConnectClient();
  const qc = useQueryClient();

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const pendingRequestsQuery = useQuery({
    queryKey: ["installation-requests", activeOrg?.id],
    queryFn: () => client!.installationRequests.list(),
    enabled: !!client,
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => client!.installationRequests.approve(requestId),
    onSuccess: () => {
      toast.success("Verbindung erstellt");
      void qc.invalidateQueries({ queryKey: ["connections"] });
      void qc.invalidateQueries({ queryKey: ["installation-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const connectionsQuery = useQuery({
    queryKey: ["connections", activeOrg?.id],
    queryFn: () => client!.connections.list(),
    enabled: !!client,
  });

  const appById = new Map((appsQuery.data ?? []).map((a: AppItem) => [a.id, a]));
  const pending = pendingRequestsQuery.data ?? [];
  const hasPending = pending.length > 0;

  const [tab, setTab] = useState("active");
  const initialDefaultRef = useRef(false);

  useEffect(() => {
    initialDefaultRef.current = false;
  }, [location.pathname, activeOrg?.id]);

  useEffect(() => {
    if (!pendingRequestsQuery.isSuccess || initialDefaultRef.current) return;
    initialDefaultRef.current = true;
    if (pending.length > 0) setTab("pending");
  }, [pendingRequestsQuery.isSuccess, pending.length]);

  useEffect(() => {
    if (!hasPending && tab === "pending") setTab("active");
  }, [hasPending, tab]);

  const connections = connectionsQuery.data ?? [];
  const active = connections.filter((c) => c.status === "active");
  const paused = connections.filter((c) => c.status === "paused");
  const revoked = connections.filter((c) => c.status === "revoked");

  /** Avoid Radix Tabs controlled value pointing at a trigger that is not mounted. */
  const tabValue = !hasPending && tab === "pending" ? "active" : tab;

  const label = (a: AppItem | undefined, id: string) => (a ? a.name : id.slice(0, 8) + "…");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verbindungen</h1>
          <p className="text-sm text-muted-foreground mt-1">Verwalten Sie Ihre App-Integrationen</p>
        </div>
        <Link to="/connections/new" className={buttonVariants()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Neue Verbindung
        </Link>
      </div>

      <Tabs value={tabValue} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          {hasPending && (
            <TabsTrigger value="pending">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Ausstehend
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {pending.length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="active">
            Aktiv
            {active.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paused">
            Pausiert
            {paused.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {paused.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revoked">
            Widerrufen
            {revoked.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {revoked.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">Alle</TabsTrigger>
        </TabsList>

        {hasPending && (
          <TabsContent value="pending">
            <PendingInstallationList
              pending={pending}
              appById={appById}
              label={label}
              approveMutation={approveMutation}
              isLoading={pendingRequestsQuery.isLoading}
            />
          </TabsContent>
        )}

        {[
          { value: "active", list: active },
          { value: "paused", list: paused },
          { value: "revoked", list: revoked },
          { value: "all", list: connections },
        ].map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <ConnectionList
              connections={t.list}
              isLoading={connectionsQuery.isLoading}
              appById={appById}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PendingInstallationList({
  pending,
  appById,
  label,
  approveMutation,
  isLoading,
}: {
  pending: InstallationRequestItem[];
  appById: Map<string, AppItem>;
  label: (a: AppItem | undefined, id: string) => string;
  approveMutation: {
    mutate: (requestId: string) => void;
    isPending: boolean;
    variables: string | undefined;
  };
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        Genehmigen Sie eine Anfrage zur Erstellung der Verbindung. Bis dahin wird nur die Übermittlung im Prüfprotokoll erfasst.
      </p>
      <AnimatePresence>
        {pending.map((req) => {
          const source = appById.get(req.sourceAppId);
          const target = appById.get(req.targetAppId);
          return (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className="border-amber-500/25 bg-amber-500/[0.04]">
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-sm font-semibold truncate">
                        {label(source, req.sourceAppId)} → {label(target, req.targetAppId)}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {req.requestedScopes.length} scope
                        {req.requestedScopes.length === 1 ? "" : "s"} ·{" "}
                        {new Date(req.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      disabled={approveMutation.isPending}
                      onClick={() => approveMutation.mutate(req.id)}
                    >
                      {approveMutation.isPending && approveMutation.variables === req.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Genehmigen
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ConnectionList({
  connections,
  isLoading,
  appById,
}: {
  connections: ConnectionItem[];
  isLoading: boolean;
  appById: Map<string, AppItem>;
}) {
  const appName = (id: string) => appById.get(id)?.name ?? id;

  if (isLoading) {
    return (
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Plug className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="font-semibold">Keine Verbindungen</h3>
        <p className="text-sm text-muted-foreground">
          Erstellen Sie eine neue Verbindung, um Ihre Apps zu integrieren
        </p>
        <Link to="/connections/new" className={buttonVariants({ variant: "outline" })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Neue Verbindung
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <AnimatePresence>
        {connections.map((conn, i) => (
          <motion.div
            key={conn.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to="/connections/$connectionId"
              params={{ connectionId: conn.id }}
              className="block"
            >
              <Card className="transition-all hover:shadow-sm hover:border-primary/30 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-sm font-semibold flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                        <span className="truncate min-w-0">{appName(conn.sourceAppId)}</span>
                        <span className="text-muted-foreground shrink-0">→</span>
                        <span className="truncate min-w-0">{appName(conn.targetAppId)}</span>
                      </CardTitle>
                      <p className="text-[10px] text-muted-foreground font-mono leading-relaxed break-all">
                        {conn.sourceAppId} → {conn.targetAppId}
                      </p>
                    </div>
                    <StatusBadge status={conn.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">
                    Erstellt {new Date(conn.createdAt).toLocaleDateString("de-DE")} · Aktualisiert{" "}
                    {new Date(conn.updatedAt).toLocaleDateString("de-DE")}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "paused" | "revoked" }) {
  const map = {
    active: { variant: "default" as const, icon: CheckCircle2, label: "Aktiv" },
    paused: { variant: "secondary" as const, icon: PauseCircle, label: "Pausiert" },
    revoked: { variant: "destructive" as const, icon: AlertCircle, label: "Widerrufen" },
  };
  const { variant, icon: Icon, label } = map[status];
  return (
    <Badge variant={variant} className="gap-1 text-[10px]">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}
