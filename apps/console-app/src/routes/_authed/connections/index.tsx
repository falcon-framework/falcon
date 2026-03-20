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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@falcon-framework/ui/components/tabs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Plug, PlusCircle, AlertCircle, CheckCircle2, PauseCircle } from "lucide-react";
import { useMemo } from "react";

import { authClient } from "@/lib/auth-client";
import { makeConnectClient, type ConnectionItem } from "@/lib/connect-client";

export const Route = createFileRoute("/_authed/connections/")({
  component: ConnectionsPage,
});

function ConnectionsPage() {
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

  const connections = connectionsQuery.data ?? [];
  const active = connections.filter((c) => c.status === "active");
  const paused = connections.filter((c) => c.status === "paused");
  const revoked = connections.filter((c) => c.status === "revoked");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your app integrations
          </p>
        </div>
        <Link to="/connections/new" className={buttonVariants()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New connection
        </Link>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {active.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {active.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused
            {paused.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {paused.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="revoked">
            Revoked
            {revoked.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {revoked.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {[
          { value: "active", list: active },
          { value: "paused", list: paused },
          { value: "revoked", list: revoked },
          { value: "all", list: connections },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <ConnectionList
              connections={tab.list}
              isLoading={connectionsQuery.isLoading}
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
}: {
  connections: ConnectionItem[];
  isLoading: boolean;
}) {
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
        <h3 className="font-semibold">No connections</h3>
        <p className="text-sm text-muted-foreground">
          Create a new connection to integrate your apps
        </p>
        <Link
          to="/connections/new"
          className={buttonVariants({ variant: "outline" })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          New connection
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
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">
                        {conn.sourceAppId}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono text-xs bg-muted rounded px-1.5 py-0.5">
                        {conn.targetAppId}
                      </span>
                    </CardTitle>
                    <StatusBadge status={conn.status} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">
                    Created {new Date(conn.createdAt).toLocaleDateString()} ·{" "}
                    Updated {new Date(conn.updatedAt).toLocaleDateString()}
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
    active: { variant: "default" as const, icon: CheckCircle2, label: "Active" },
    paused: { variant: "secondary" as const, icon: PauseCircle, label: "Paused" },
    revoked: { variant: "destructive" as const, icon: AlertCircle, label: "Revoked" },
  };
  const { variant, icon: Icon, label } = map[status];
  return (
    <Badge variant={variant} className="gap-1 text-[10px]">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}
