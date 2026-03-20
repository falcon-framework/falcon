import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Badge } from "@falcon-framework/ui/components/badge";
import { buttonVariants } from "@falcon-framework/ui/components/button";
import { Input } from "@falcon-framework/ui/components/input";
import { Skeleton } from "@falcon-framework/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Store, Search, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { makeConnectClient } from "@/lib/connect-client";

export const Route = createFileRoute("/_authed/apps/")({
  component: AppsPage,
});

function AppsPage() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const [search, setSearch] = useState("");

  const client = useMemo(
    () => (activeOrg?.id ? makeConnectClient(activeOrg.id) : null),
    [activeOrg?.id],
  );

  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => client!.apps.list(),
    enabled: !!client,
  });

  const apps = appsQuery.data ?? [];
  const filtered = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">App Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and connect available applications
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search apps…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {appsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Store className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-semibold">
            {search ? "No apps match your search" : "No apps available"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {search ? "Try a different search term" : "Apps will appear here when registered"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <Card className="group flex flex-col h-full transition-all hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                      {app.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{app.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{app.slug}</CardDescription>
                    </div>
                    <Badge
                      variant={app.status === "active" ? "default" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {app.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {app.description ?? "No description provided."}
                  </p>
                  <Link
                    to="/apps/$appId"
                    params={{ appId: app.id }}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View capabilities
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
