import {
  LayoutDashboard,
  Users,
  Clock3,
  CalendarDays,
  Timer,
  Wallet,
  Briefcase,
  Settings,
} from "lucide-react";

export const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: Clock3,
  },
  {
    title: "Leave",
    href: "/leave",
    icon: CalendarDays,
  },
  {
    title: "Overtime",
    href: "/overtime",
    icon: Timer,
  },
  {
    title: "Payroll",
    href: "/payroll",
    icon: Wallet,
  },
  {
    title: "Recruitment",
    href: "/recruitment",
    icon: Briefcase,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
