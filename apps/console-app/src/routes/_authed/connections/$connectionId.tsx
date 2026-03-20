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
  AlertCircle,
  XCircle,
  Key,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { makeConnectClient } from "@/lib/connect-client";

export const Route = createFileRoute("/_authed/connections/$connectionId")({
  component: ConnectionDetailPage,
});

function ConnectionDetailPage() {
  const { connectionId } = useParams({ from: "/_authed/connections/$connectionId" });
  const { data: activeOrg } = authClient.useActiveOrganization();
  const qc = useQueryClient();

  const client = useMemo(
    () => (activeOrg?.id ? makeConnectClient(activeOrg.id) : null),
    [activeOrg?.id],
  );

  const connQuery = useQuery({
    queryKey: ["connection", connectionId, activeOrg?.id],
    queryFn: () => client!.connections.get(connectionId),
    enabled: !!client,
  });

  const revokeMutation = useMutation({
    mutationFn: () => client!.connections.revoke(connectionId),
    onSuccess: () => {
      toast.success("Connection revoked");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection", connectionId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const pauseMutation = useMutation({
    mutationFn: () => client!.connections.pause(connectionId),
    onSuccess: () => {
      toast.success("Connection paused");
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connection", connectionId] });
    },
    onError: (e) => toast.error(e.message),
  });

  const syncMutation = useMutation({
    mutationFn: () => client!.connections.sync(connectionId),
    onSuccess: () => toast.success("Sync job triggered"),
    onError: (e) => toast.error(e.message),
  });

  const conn = connQuery.data;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        to="/connections"
        className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2"}
      >
        <ArrowLeft className="h-4 w-4" />
        Connections
      </Link>

      {connQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </div>
      ) : !conn ? (
        <p className="text-muted-foreground">Connection not found.</p>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-mono">
                  {conn.sourceAppId}
                  <span className="text-muted-foreground mx-2">→</span>
                  {conn.targetAppId}
                </h1>
                <StatusBadge status={conn.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ID: <span className="font-mono">{conn.id}</span>
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
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                  >
                    <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
                    Pause
                  </Button>
                </>
              )}
              {conn.status !== "revoked" && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm">
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Revoke
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke connection?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently revoke the connection between{" "}
                        <strong>{conn.sourceAppId}</strong> and{" "}
                        <strong>{conn.targetAppId}</strong>. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => revokeMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Revoke
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
            <InfoCard label="Organization" value={conn.organizationId} mono />
            <InfoCard label="Created by" value={conn.createdByUserId} mono />
            <InfoCard
              label="Created"
              value={new Date(conn.createdAt).toLocaleString()}
            />
            <InfoCard
              label="Last updated"
              value={new Date(conn.updatedAt).toLocaleString()}
            />
          </div>

          {/* Scopes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-4 w-4" />
                Granted Scopes
              </CardTitle>
              <CardDescription>Permissions active on this connection</CardDescription>
            </CardHeader>
            <CardContent>
              {conn.scopes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scopes granted.</p>
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

function InfoCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border p-3 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium truncate ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "paused" | "revoked" }) {
  const map = {
    active: { variant: "default" as const, icon: CheckCircle2 },
    paused: { variant: "secondary" as const, icon: PauseCircle },
    revoked: { variant: "destructive" as const, icon: AlertCircle },
  };
  const { variant, icon: Icon } = map[status];
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}
