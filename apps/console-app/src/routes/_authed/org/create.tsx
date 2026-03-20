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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { motion } from "motion/react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_authed/org/create")({
  component: CreateOrgPage,
});

function CreateOrgPage() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: { name: "", slug: "" },
    onSubmit: async ({ value }) => {
      const result = await authClient.organization.create({
        name: value.name,
        slug: value.slug,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Failed to create organization");
        return;
      }
      await authClient.organization.setActive({
        organizationId: result.data!.id,
      });
      toast.success(`Organization "${value.name}" created!`);
      navigate({ to: "/dashboard" });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "At least 2 characters"),
        slug: z
          .string()
          .min(2, "At least 2 characters")
          .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers and hyphens"),
      }),
    },
  });

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Create Organization</h1>
          <p className="text-sm text-muted-foreground">
            Organizations group your connections and apps
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization details</CardTitle>
            <CardDescription>
              You can change these later in organization settings
            </CardDescription>
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
                    <Label htmlFor={field.name}>Organization name</Label>
                    <Input
                      id={field.name}
                      placeholder="Acme Corp"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        // Auto-slug
                        const slugField = form.getFieldValue("slug");
                        if (!slugField) {
                          form.setFieldValue(
                            "slug",
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]/g, "-")
                              .replace(/-+/g, "-")
                              .replace(/^-|-$/g, ""),
                          );
                        }
                      }}
                    />
                    {field.state.meta.errors.map((err) => (
                      <p key={err?.message} className="text-xs text-destructive">
                        {err?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field name="slug">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Slug</Label>
                    <Input
                      id={field.name}
                      placeholder="acme-corp"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Used in URLs · Only lowercase letters, numbers, and hyphens
                    </p>
                    {field.state.meta.errors.map((err) => (
                      <p key={err?.message} className="text-xs text-destructive">
                        {err?.message}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Subscribe
                selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
              >
                {({ canSubmit, isSubmitting }) => (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      "Create organization"
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
