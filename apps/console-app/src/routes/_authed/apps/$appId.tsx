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
import { Separator } from "@falcon-framework/ui/components/separator";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft, Zap, Link2 } from "lucide-react";
import { useConnectClient } from "@/hooks/use-connect-client";

export const Route = createFileRoute("/_authed/apps/$appId")({
  component: AppDetailPage,
});

function AppDetailPage() {
  const { appId } = useParams({ from: "/_authed/apps/$appId" });
  const client = useConnectClient();

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const capabilitiesQuery = useQuery({
    queryKey: ["capabilities", appId],
    queryFn: () => client!.apps.capabilities(appId),
    // Run after apps list succeeds so we don't race two parallel credentialed connect calls (first often 401’d).
    enabled: !!client && !!appId && appsQuery.isSuccess,
  });

  const app = appsQuery.data?.find((a) => a.id === appId);
  const capabilities = capabilitiesQuery.data ?? [];
  const capabilitiesLoading =
    appsQuery.isPending || (appsQuery.isSuccess && capabilitiesQuery.isPending);

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/apps" className={buttonVariants({ variant: "ghost", size: "sm" }) + " -ml-2"}>
        <ArrowLeft className="h-4 w-4" />
        Apps
      </Link>

      {/* App header */}
      {appsQuery.isLoading ? (
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      ) : app ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-4"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-xl font-bold">
            {app.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{app.name}</h1>
              <Badge variant={app.status === "active" ? "default" : "secondary"}>
                {app.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {app.description ?? "No description provided."}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{app.slug}</p>
          </div>
        </motion.div>
      ) : !appsQuery.isLoading ? (
        <p className="text-muted-foreground">App not found.</p>
      ) : null}

      <Separator />

      {/* Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Capabilities
          </CardTitle>
          <CardDescription>Scopes this app can grant or request</CardDescription>
        </CardHeader>
        <CardContent>
          {appsQuery.isError ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Could not load apps. Try refreshing the page.
            </p>
          ) : capabilitiesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : capabilities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No capabilities defined.
            </p>
          ) : (
            <div className="space-y-2">
              {capabilities.map((cap, i) => (
                <motion.div
                  key={cap.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <code className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-primary">
                    {cap.scopeKey}
                  </code>
                  <p className="text-sm text-muted-foreground flex-1">
                    {cap.description ?? "No description."}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action */}
      {app && (
        <div className="flex justify-end">
          <Link to="/connections/new" search={{ sourceAppId: app.id }} className={buttonVariants()}>
            <Link2 className="mr-2 h-4 w-4" />
            Create connection
          </Link>
        </div>
      )}
    </div>
  );
}
