import { Badge } from "@falcon-framework/ui/components/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@falcon-framework/ui/components/dropdown-menu";
import { Button } from "@falcon-framework/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { Building2, ChevronDown, PlusCircle, Settings } from "lucide-react";
import { toast } from "sonner";

import { de } from "@/i18n/de";
import { useActiveOrg } from "@/providers/active-org";

export default function OrgSwitcher() {
  const navigate = useNavigate();
  const { activeOrg, orgs, switchOrg } = useActiveOrg();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="h-8 gap-1.5 text-sm" />}
      >
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-40 truncate">{activeOrg?.name ?? de.orgSwitcher.placeholder}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            {de.orgSwitcher.label}
          </DropdownMenuLabel>
          {orgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={async () => {
                await switchOrg(org.id);
                toast.success(de.orgSwitcher.switched(org.name));
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
                  {de.orgSwitcher.active}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
          {orgs.length === 0 && (
            <DropdownMenuItem disabled className="text-muted-foreground text-sm">
              {de.orgSwitcher.empty}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {activeOrg && (
            <DropdownMenuItem onClick={() => navigate({ to: "/org/settings" })}>
              <Settings className="mr-2 h-4 w-4" />
              {de.orgSwitcher.settings}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate({ to: "/org/create" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {de.orgSwitcher.createOrg}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
