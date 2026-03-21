import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Badge } from "@falcon-framework/ui/components/badge";
import { Button, buttonVariants } from "@falcon-framework/ui/components/button";
import { Skeleton } from "@falcon-framework/ui/components/skeleton";
import { Separator } from "@falcon-framework/ui/components/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@falcon-framework/ui/components/alert-dialog";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  XCircle,
  Key,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

import { useConnectClient } from "@/hooks/use-connect-client";
import type { AppItem } from "@/lib/connect-client";
import { useActiveOrg } from "@/providers/active-org";
import AppNameDisplay from "@/components/app-name-display";

export const Route = createFileRoute("/_authed/connections/$connectionId")({
  component: ConnectionDetailPage,
});

function ConnectionDetailPage() {
  const { connectionId } = useParams({
    from: "/_authed/connections/$connectionId",
  });
  const { activeOrg } = useActiveOrg();
  const qc = useQueryClient();
  const client = useConnectClient();

  const connQuery = useQuery({
    queryKey: ["connection", connectionId, activeOrg?.id],
    queryFn: () => client!.connections.get(connectionId),
    enabled: !!client,
  });

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const appById = useMemo(
    () => new Map((appsQuery.data ?? []).map((a: AppItem) => [a.id, a])),
    [appsQuery.data],
  );

  const revokeMutation = useMutation({
    mutationFn: () => client!.connections.revoke(connectionId),
    onSuccess: () => {
      toast.success("Verbindung widerrufen");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection", connectionId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pauseMutation = useMutation({
    mutationFn: () => client!.connections.pause(connectionId),
    onSuccess: () => {
      toast.success("Verbindung pausiert");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection", connectionId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const resumeMutation = useMutation({
    mutationFn: () => client!.connections.resume(connectionId),
    onSuccess: () => {
      toast.success("Verbindung fortgesetzt");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection", connectionId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const syncMutation = useMutation({
    mutationFn: () => client!.connections.sync(connectionId),
    onSuccess: () => toast.success("Synchronisierungsauftrag gestartet"),
    onError: (e) => toast.error(e.message),
  });

  const conn = connQuery.data;
  const sourceApp = appById.get(conn?.sourceAppId ?? "");
  const targetApp = appById.get(conn?.targetAppId ?? "");
  const sourceName = conn ? (sourceApp?.name ?? conn.sourceAppId) : "";
  const targetName = conn ? (targetApp?.name ?? conn.targetAppId) : "";

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to="/connections"
        className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2"}
      >
        <ArrowLeft className="h-4 w-4" />
        Verbindungen
      </Link>

      {connQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : !conn ? (
        <p className="text-muted-foreground">Verbindung nicht gefunden.</p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span>{sourceName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>{targetName}</span>
                </h1>
                <StatusBadge status={conn.status} />
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-1.5 break-all">
                Apps: {conn.sourceAppId} → {conn.targetAppId}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connection ID: <span className="font-mono">{conn.id}</span>
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {conn.status === "active" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
                    />
                    Synchronisieren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                  >
                    <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
                    Pausieren
                  </Button>
                </>
              )}
              {conn.status === "paused" && (
                <Button
                  size="sm"
                  onClick={() => resumeMutation.mutate()}
                  disabled={resumeMutation.isPending}
                >
                  <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                  Fortsetzen
                </Button>
              )}
              {conn.status !== "revoked" && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm">
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Widerrufen
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Verbindung widerrufen?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Dadurch wird die Verbindung zwischen{" "}
                        <AppNameDisplay
                          app={sourceApp}
                          idFallback={conn.sourceAppId}
                        />{" "}
                        und{" "}
                        <AppNameDisplay
                          app={targetApp}
                          idFallback={conn.targetAppId}
                        />{" "}
                        dauerhaft widerrufen. Diese Aktion kann nicht rückgängig
                        gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => revokeMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Widerrufen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <Separator />

          {/* Details grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard label="Organisation" value={conn.organizationId} mono />
            <InfoCard label="Erstellt von" value={conn.createdByUserId} mono />
            <InfoCard
              label="Erstellt"
              value={new Date(conn.createdAt).toLocaleString("de-DE")}
            />
            <InfoCard
              label="Zuletzt aktualisiert"
              value={new Date(conn.updatedAt).toLocaleString("de-DE")}
            />
          </div>

          {/* Scopes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                Gewährte Berechtigungen
              </CardTitle>
              <CardDescription>
                Aktive Berechtigungen für diese Verbindung
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conn.scopes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Keine Berechtigungen gewährt.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {conn.scopes.map((s) => (
                    <code
                      key={s}
                      className="rounded bg-muted px-2 py-1 text-xs font-mono text-primary"
                    >
                      {s}
                    </code>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-medium truncate ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "paused" | "revoked" }) {
  const map = {
    active: { variant: "default" as const, icon: CheckCircle2, label: "Aktiv" },
    paused: {
      variant: "secondary" as const,
      icon: PauseCircle,
      label: "Pausiert",
    },
    revoked: {
      variant: "destructive" as const,
      icon: AlertCircle,
      label: "Widerrufen",
    },
  };
  const { variant, icon: Icon, label } = map[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
