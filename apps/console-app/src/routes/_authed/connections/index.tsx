import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Badge } from "@falcon-framework/ui/components/badge";
import { Skeleton } from "@falcon-framework/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@falcon-framework/ui/components/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Plug, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";

import type { AppItem, ConnectionItem } from "@/lib/connect-client";
import { de } from "@/i18n/de";
import { useConnectClient } from "@/hooks/use-connect-client";
import { useActiveOrg } from "@/providers/active-org";

export const Route = createFileRoute("/_authed/connections/")({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { activeOrg } = useActiveOrg();
  const client = useConnectClient();

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const connectionsQuery = useQuery({
    queryKey: ["connections", activeOrg?.id],
    queryFn: () => client!.connections.list(),
    enabled: !!client,
  });

  const appById = new Map((appsQuery.data ?? []).map((a: AppItem) => [a.id, a]));

  const connections = connectionsQuery.data ?? [];
  const active = connections.filter((c) => c.status === "active");
  const paused = connections.filter((c) => c.status === "paused");
  const revoked = connections.filter((c) => c.status === "revoked");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{de.connections.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{de.connections.subtitle}</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="active">
            {de.connections.tabActive}
            {active.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paused">
            {de.connections.tabPaused}
            {paused.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {paused.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revoked">
            {de.connections.tabRevoked}
            {revoked.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {revoked.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">{de.connections.tabAll}</TabsTrigger>
        </TabsList>

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
        <h3 className="font-semibold">{de.connections.emptyTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{de.connections.emptyBody}</p>
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
                    </div>
                    <StatusBadge status={conn.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">
                    {de.connections.created} {new Date(conn.createdAt).toLocaleDateString("de-DE")}{" "}
                    · {de.connections.updated}{" "}
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
    active: { variant: "default" as const, icon: CheckCircle2, label: de.connections.statusActive },
    paused: {
      variant: "secondary" as const,
      icon: PauseCircle,
      label: de.connections.statusPaused,
    },
    revoked: {
      variant: "destructive" as const,
      icon: AlertCircle,
      label: de.connections.statusRevoked,
    },
  };
  const { variant, icon: Icon, label } = map[status];
  return (
    <Badge variant={variant} className="gap-1 text-[10px]">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}
