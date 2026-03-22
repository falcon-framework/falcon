import type { FalconConnectApp } from "@falcon-framework/sdk/connect";
import { Badge } from "@falcon-framework/ui/components/badge";
import { cn } from "@falcon-framework/ui/lib/utils";
import { ChevronRight, LayoutGrid } from "lucide-react";

type Props = {
  app?: FalconConnectApp | null | undefined;
  idFallback?: string;
};

export default function AppNameDisplay({ app, idFallback }: Props) {
  let label = idFallback;
  if (app) {
    label = app.name || app.id;
  }
  const title = label;

  return (
    <a
      href="/this-will-be-a-404-purposefully"
      title={title}
      className="group inline-flex max-w-full min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Badge
        variant="outline"
        className={cn(
          "h-6 max-w-full gap-1.5 border-border/90 bg-linear-to-br from-card via-card to-muted/35 px-2 py-0 text-xs font-medium shadow-sm ring-1 ring-border/40 transition-[box-shadow,transform,filter] duration-200",
          "[a]:hover:-translate-y-px [a]:hover:border-primary/40 [a]:hover:shadow-md [a]:hover:ring-primary/25",
          idFallback && "font-mono text-[0.65rem]",
        )}
      >
        <LayoutGrid
          className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground/85"
          aria-hidden
        />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronRight className="size-3 shrink-0 opacity-45" aria-hidden />
      </Badge>
    </a>
  );
}
