"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export interface NavMainItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isExactMatch = pathname === item.url;
            const isNestedMatch = pathname.startsWith(item.url + "/");

            // Cari item lain yang path-nya lebih spesifik (lebih panjang) dan juga match.
            // Kalau ada, item ini (yang lebih umum) tidak dianggap aktif.
            const hasMoreSpecificMatch = items.some(
              (other) =>
                other.url !== item.url &&
                other.url.startsWith(item.url + "/") &&
                (pathname === other.url || pathname.startsWith(other.url + "/"))
            );

            const isActive =
              item.url === "/dashboard"
                ? isExactMatch
                : (isExactMatch || isNestedMatch) && !hasMoreSpecificMatch;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isActive}
                  render={
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
