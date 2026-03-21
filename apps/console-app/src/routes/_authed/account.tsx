import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@falcon-framework/ui/components/card";
import { Button } from "@falcon-framework/ui/components/button";
import { Input } from "@falcon-framework/ui/components/input";
import { Label } from "@falcon-framework/ui/components/label";
import { Separator } from "@falcon-framework/ui/components/separator";
import { Avatar, AvatarFallback } from "@falcon-framework/ui/components/avatar";
import { Badge } from "@falcon-framework/ui/components/badge";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { Loader2, LogOut, UserCircle, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useActiveOrg } from "@/providers/active-org";

export const Route = createFileRoute("/_authed/account")({
  component: AccountPage,
});

function AccountPage() {
  const { data: session } = authClient.useSession();
  const { activeOrg } = useActiveOrg();
  const navigate = useNavigate();

  if (!session) return null;

  const { user } = session;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile</p>
      </div>

      {/* Profile card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <p className="text-xs text-muted-foreground mt-1">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Edit profile */}
      <EditProfileForm currentName={user.name} />

      {/* Organization */}
      {activeOrg && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Active Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{activeOrg.name}</p>
                  <p className="text-xs text-muted-foreground">{(activeOrg as any).slug ?? ""}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {(activeOrg as any).members?.find?.((m: any) => m.userId === user.id)?.role ??
                    "member"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Sign out */}
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
          <CardDescription>Sign out of your account on this device</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => navigate({ to: "/login" }),
                },
              })
            }
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EditProfileForm({ currentName }: { currentName: string }) {
  const [saving, setSaving] = useState(false);

  const form = useForm({
    defaultValues: { name: currentName },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        await authClient.updateUser({ name: value.name });
        toast.success("Profile updated");
      } catch {
        toast.error("Failed to update profile");
      } finally {
        setSaving(false);
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
      }),
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCircle className="h-4 w-4" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-1.5">
                <Label>Display name</Label>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((err) => (
                  <p key={err?.message} className="text-xs text-destructive">
                    {err?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
