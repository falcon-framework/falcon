import { Card, CardDescription, CardHeader, CardTitle } from "@falcon-framework/ui/components/card";
import { Button } from "@falcon-framework/ui/components/button";
import { Skeleton } from "@falcon-framework/ui/components/skeleton";
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
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Shield, XCircle } from "lucide-react";
import { toast } from "sonner";

import { de } from "@/i18n/de";
import { authAppsClient } from "@/lib/auth-apps-client";

export const Route = createFileRoute("/_authed/apps/")({
  component: AuthAppsPage,
});

function AuthAppsPage() {
  const qc = useQueryClient();

  const appsQuery = useQuery({
    queryKey: ["auth-apps"],
    queryFn: () => authAppsClient.list(),
  });

  const revokeMutation = useMutation({
    mutationFn: (appId: string) => authAppsClient.revoke(appId),
    onSuccess: () => {
      toast.success(de.apps.toastRevoked);
      void qc.invalidateQueries({ queryKey: ["auth-apps"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apps = appsQuery.data ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{de.apps.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{de.apps.subtitle}</p>
      </div>

      {appsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-semibold">{de.apps.emptyTitle}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{de.apps.emptyBody}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app, i) => (
            <motion.div
              key={app.appId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {app.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm truncate">{app.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {de.apps.connected}{" "}
                          {new Date(app.connectedAt).toLocaleDateString("de-DE")}
                        </CardDescription>
                      </div>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            {de.apps.revoke}
                          </Button>
                        }
                      />
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{de.apps.revokeTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {de.apps.revokeDescriptionBefore}
                            <strong>{app.name}</strong>
                            {de.apps.revokeDescriptionAfter}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{de.apps.cancel}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => revokeMutation.mutate(app.appId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {de.apps.revokeConfirm}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
