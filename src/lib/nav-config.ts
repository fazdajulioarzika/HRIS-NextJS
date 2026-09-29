import {
  LayoutDashboard,
  Users,
  Clock3,
  CalendarDays,
  Timer,
  Wallet,
  Briefcase,
  Settings,
  HelpCircle,
  Search,
} from "lucide-react";

import type { NavMainItem } from "@/components/nav-main";
import type { UserRole } from "@/contexts/profile-context";

export interface NavMainConfigItem extends NavMainItem {
  roles: UserRole[];
}

export const navMainConfig: NavMainConfigItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["hr", "manager", "employee"],
  },
  { title: "Employees", url: "/employees", icon: Users, roles: ["hr"] },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Clock3,
    roles: ["hr", "employee", "manager"],
  },
  {
    title: "Leave",
    url: "/leave",
    icon: CalendarDays,
    roles: ["hr", "employee", "manager"],
  },
  {
    title: "Leave Tim",
    url: "/leave/team",
    icon: CalendarDays,
    roles: ["manager"],
  },
  {
    title: "Overtime",
    url: "/overtime",
    icon: Timer,
    roles: ["hr", "employee"],
  },
  {
    title: "Overtime Tim",
    url: "/overtime/team",
    icon: Timer,
    roles: ["manager"],
  },
  { title: "Payroll", url: "/payroll", icon: Wallet, roles: ["hr"] },
  { title: "Recruitment", url: "/recruitment", icon: Briefcase, roles: ["hr"] },
];

export const navSecondaryConfig: NavMainConfigItem[] = [
  { title: "Settings", url: "/settings", icon: Settings, roles: ["hr"] },
  {
    title: "Get Help",
    url: "/help",
    icon: HelpCircle,
    roles: ["hr", "manager", "employee"],
  },
  {
    title: "Search",
    url: "/search",
    icon: Search,
    roles: ["hr", "manager", "employee"],
  },
];
