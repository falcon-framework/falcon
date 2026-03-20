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
import { Badge } from "@falcon-framework/ui/components/badge";
import { Separator } from "@falcon-framework/ui/components/separator";
import { Avatar, AvatarFallback } from "@falcon-framework/ui/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@falcon-framework/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@falcon-framework/ui/components/select";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { Building2, UserPlus, Mail, Loader2, Crown, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { getUser } from "@/functions/get-user";
import { useActiveOrg } from "@/providers/active-org";

export const Route = createFileRoute("/_authed/org/settings")({
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) throw redirect({ to: "/login" });
  },
  component: OrgSettingsPage,
});

function OrgSettingsPage() {
  const { activeOrg } = useActiveOrg();

  if (!activeOrg) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">No organization selected</h2>
        <p className="text-sm text-muted-foreground">
          Select or create an organization to manage settings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage <span className="font-medium text-foreground">{activeOrg.name}</span>
        </p>
      </div>

      <GeneralSettings org={activeOrg} />
      <Separator />
      <MembersSection org={activeOrg} />
      <Separator />
      <InviteSection orgId={activeOrg.id} />
    </div>
  );
}

function GeneralSettings({ org }: { org: { id: string; name: string; slug: string } }) {
  const [saving, setSaving] = useState(false);

  const form = useForm({
    defaultValues: { name: org.name },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const result = await authClient.organization.update({
          data: { name: value.name },
        });
        if (result.error) {
          toast.error(result.error.message ?? "Update failed");
        } else {
          toast.success("Organization updated");
        }
      } finally {
        setSaving(false);
      }
    },
    validators: {
      onSubmit: z.object({ name: z.string().min(2) }),
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">General</CardTitle>
        <CardDescription>Basic organization information</CardDescription>
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
                <Label>Name</Label>
                <Input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input value={org.slug} disabled className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Slug cannot be changed after creation</p>
          </div>

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

const ROLE_ICONS = {
  owner: Crown,
  admin: ShieldCheck,
  member: User,
};

const ROLE_COLORS = {
  owner: "default",
  admin: "secondary",
  member: "outline",
} as const;

function MembersSection(_: { org: { id: string } }) {
  const { activeOrg: fullOrg } = useActiveOrg();

  const members = (fullOrg as any)?.members ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Members</CardTitle>
        <CardDescription>People in this organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading members…</p>
        ) : (
          members.map((m: any) => {
            const RoleIcon = ROLE_ICONS[m.role as keyof typeof ROLE_ICONS] ?? User;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {(m.user?.name ?? m.userId).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.user?.name ?? m.userId}</div>
                  {m.user?.email && (
                    <div className="text-xs text-muted-foreground truncate">{m.user.email}</div>
                  )}
                </div>
                <Badge
                  variant={ROLE_COLORS[m.role as keyof typeof ROLE_COLORS] ?? "outline"}
                  className="gap-1 text-[10px]"
                >
                  <RoleIcon className="h-2.5 w-2.5" />
                  {m.role}
                </Badge>
              </motion.div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function InviteSection({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"admin" | "member">("member");

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      const result = await authClient.organization.inviteMember({
        organizationId: orgId,
        email: value.email,
        role,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to send invite");
      } else {
        toast.success(`Invitation sent to ${value.email}`);
        setOpen(false);
        form.reset();
      }
    },
    validators: {
      onSubmit: z.object({ email: z.email("Invalid email") }),
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Invite Members</CardTitle>
          <CardDescription>Send email invitations to teammates</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite team member</DialogTitle>
              <DialogDescription>
                They'll receive an email to join your organization
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              <form.Field name="email">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label>Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="colleague@example.com"
                        className="pl-9"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                      />
                    </div>
                    {field.state.meta.errors.map((err) => (
                      <p key={err?.message} className="text-xs text-destructive">
                        {err?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <form.Subscribe
                  selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
                >
                  {({ canSubmit, isSubmitting }) => (
                    <Button type="submit" disabled={!canSubmit || isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "Send invite"
                      )}
                    </Button>
                  )}
                </form.Subscribe>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
    </Card>
  );
}
