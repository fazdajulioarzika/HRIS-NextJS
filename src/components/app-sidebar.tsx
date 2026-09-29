"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navMainConfig, navSecondaryConfig } from "@/lib/nav-config";
import { useProfileContext } from "@/contexts/profile-context";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, loading } = useProfileContext();
  const role = profile?.role ?? "employee";

  const navMain = navMainConfig.filter((item) => item.roles.includes(role));
  const navSecondary = navSecondaryConfig.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
              <Link href="/dashboard">
                <span className="text-lg font-semibold">HRIS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {loading ? null : (
          <>
            <NavMain items={navMain} />
            <NavSecondary items={navSecondary} className="mt-auto" />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
