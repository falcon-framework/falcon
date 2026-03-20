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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, Plug, Store, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";
import { useMemo } from "react";

import { authClient } from "@/lib/auth-client";
import { makeConnectClient } from "@/lib/connect-client";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();

  const client = useMemo(
    () => (activeOrg?.id ? makeConnectClient(activeOrg.id) : null),
    [activeOrg?.id],
  );

  const connectionsQuery = useQuery({
    queryKey: ["connections", activeOrg?.id],
    queryFn: () => client!.connections.list(),
    enabled: !!client,
  });

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const connections = connectionsQuery.data ?? [];
  const apps = appsQuery.data ?? [];

  const stats = useMemo(() => {
    const active = connections.filter((c) => c.status === "active").length;
    const paused = connections.filter((c) => c.status === "paused").length;
    return { total: connections.length, active, paused };
  }, [connections]);

  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {activeOrg ? (
            <>
              Viewing <span className="font-medium text-foreground">{activeOrg.name}</span>
            </>
          ) : (
            "Select an organization to get started"
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Connections",
            value: stats.total,
            icon: Plug,
            iconClass: "",
            loading: connectionsQuery.isLoading,
          },
          {
            label: "Active",
            value: stats.active,
            icon: CheckCircle2,
            iconClass: "text-green-500",
            loading: connectionsQuery.isLoading,
          },
          {
            label: "Paused",
            value: stats.paused,
            icon: PauseCircle,
            iconClass: "text-yellow-500",
            loading: connectionsQuery.isLoading,
          },
          {
            label: "Available Apps",
            value: apps.length,
            icon: Store,
            iconClass: "",
            loading: appsQuery.isLoading,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.25 }}
          >
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardDescription className="text-xs font-medium">{stat.label}</CardDescription>
                <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.iconClass}`} />
              </CardHeader>
              <CardContent>
                {stat.loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent connections */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Connections</CardTitle>
              <CardDescription>Your latest app integrations</CardDescription>
            </div>
            <Link to="/connections" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectionsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : connections.length === 0 ? (
              <EmptyState
                icon={Plug}
                message="No connections yet"
                action={{ label: "Connect an app", to: "/connections/new" }}
              />
            ) : (
              connections.slice(0, 5).map((conn) => (
                <Link
                  key={conn.id}
                  to="/connections/$connectionId"
                  params={{ connectionId: conn.id }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {conn.sourceAppId} → {conn.targetAppId}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Created {new Date(conn.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <ConnectionStatusBadge status={conn.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* App marketplace preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">App Marketplace</CardTitle>
              <CardDescription>Available integrations</CardDescription>
            </div>
            <Link to="/apps" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Browse <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {appsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : apps.length === 0 ? (
              <EmptyState icon={Store} message="No apps in marketplace" />
            ) : (
              apps.slice(0, 5).map((app) => (
                <Link
                  key={app.id}
                  to="/apps/$appId"
                  params={{ appId: app.id }}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted font-bold text-xs">
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{app.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {app.description ?? app.slug}
                    </div>
                  </div>
                  <Badge
                    variant={app.status === "active" ? "default" : "secondary"}
                    className="text-[10px]"
                  >
                    {app.status}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConnectionStatusBadge({ status }: { status: "active" | "paused" | "revoked" }) {
  const variants = {
    active: { variant: "default" as const, icon: CheckCircle2 },
    paused: { variant: "secondary" as const, icon: PauseCircle },
    revoked: { variant: "destructive" as const, icon: AlertCircle },
  };
  const { variant, icon: Icon } = variants[status];
  return (
    <Badge variant={variant} className="gap-1 text-[10px]">
      <Icon className="h-2.5 w-2.5" />
      {status}
    </Badge>
  );
}

function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon: React.ElementType;
  message: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <Link to={action.to as any} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
