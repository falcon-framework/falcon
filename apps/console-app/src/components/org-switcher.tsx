import { Badge } from "@falcon-framework/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@falcon-framework/ui/components/dropdown-menu";
import { Button } from "@falcon-framework/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { Building2, ChevronDown, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function OrgSwitcher() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: orgs } = authClient.useListOrganizations();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="h-8 gap-1.5 text-sm" />}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[160px] truncate">{activeOrg?.name ?? "Select organization"}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {orgs?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={async () => {
              await authClient.organization.setActive({ organizationId: org.id });
              toast.success(`Switched to ${org.name}`);
            }}
          >
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-semibold">
                {org.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate">{org.name}</span>
            </div>
            {activeOrg?.id === org.id && (
              <Badge variant="secondary" className="ml-auto text-[10px]">
                active
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
        {orgs?.length === 0 && (
          <DropdownMenuItem disabled className="text-muted-foreground text-sm">
            No organizations yet
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/org/create" })}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
