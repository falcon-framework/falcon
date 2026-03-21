import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@falcon-framework/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { UserCircle, Shield, Plug, BookOpen, ChevronRight } from "lucide-react";

import { de } from "@/i18n/de";

import UserNav from "./user-nav";

const navItems = [
  {
    label: de.sidebar.groups.account,
    items: [{ title: de.sidebar.items.account, url: "/account", icon: UserCircle }],
  },
  {
    label: de.sidebar.groups.myApps,
    items: [
      { title: de.sidebar.items.authApps, url: "/apps", icon: Shield },
      { title: de.sidebar.items.connections, url: "/connections", icon: Plug },
    ],
  },
  {
    label: de.sidebar.groups.developer,
    items: [{ title: de.sidebar.items.docs, url: "/docs", icon: BookOpen }],
  },
];

export default function AppSidebar() {
  const { location } = useRouterState();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-xs">
            F
          </div>
          <span className="truncate font-semibold text-sm group-data-[collapsible=icon]:hidden">
            {de.sidebar.brand}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname.startsWith(item.url);
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link to={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                        {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
