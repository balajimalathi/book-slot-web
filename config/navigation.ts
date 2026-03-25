import type * as React from "react";

import {
  LayoutIcon,
  Mail,
  Settings,
  ShieldCheckIcon,
  ShieldUserIcon,
  UserCircle,
  Users,
  MonitorIcon,
  CreditCardIcon,
  Calendar,
  Tag,
  Bell,
  Wallet,
  Layout,
  Palette,
  Globe,
} from "lucide-react";
import { Frame, Map, PieChart } from "lucide-react";

export type NavItemType = "brand" | "link" | "cta" | "muted" | "action";

export interface NavMenuItem {
  label: string;
  url?: string;
  icon?: React.ElementType;
  badge?: string;
}

export interface NavMenuGroup {
  id: string;
  items: NavMenuItem[];
}

/**
 * Canonical navigation definition for the app.
 *
 * This mirrors the planned NAV_MENUS structure from the spec
 * and is the single source of truth for high‑level menus.
 */
export const NAV_MENUS: NavMenuGroup[] = [
  {
    id: "admin-sidebar",
    items: [
      { label: "Dashboard", url: "/dash", icon: LayoutIcon },
      { label: "Calendar", url: "/dash/calendar", icon: Calendar },
      { label: "Blackouts", url: "/dash/blackouts", icon: Calendar },
      { label: "Bookings", url: "/dash/bookings", icon: Calendar },
      { label: "Customers", url: "/dash/customers", icon: Users },
      { label: "Services", url: "/dash/services", icon: LayoutIcon },
      { label: "Staff", url: "/dash/staff", icon: Users, badge: "Pro+" },
      { label: "Coupons", url: "/dash/coupons", icon: Tag },
      { label: "Settings", url: "/dash/settings", icon: Settings },
    ],
  },
  {
    id: "admin-sidebar-schedule",
    items: [
      { label: "Availability", url: "/dash/availability", icon: UserCircle },
      { label: "Blackouts", url: "/dash/blackouts", icon: Calendar },
    ],
  },
  {
    id: "staff-sidebar",
    items: [
      { label: "My calendar", url: "/dash", icon: Calendar },
      { label: "My bookings", url: "/dash/bookings", icon: Calendar },
      { label: "My schedule", url: "/dash/schedule", icon: Calendar },
      { label: "Account", url: "/dash/account", icon: UserCircle },
    ],
  },
  {
    id: "settings-tabs",
    items: [
      { label: "Profile", url: "/dash/settings/profile", icon: UserCircle },
      { label: "Organization", url: "/dash/settings/organization", icon: UserCircle },
      { label: "Availability", url: "/dash/settings/availability", icon: UserCircle },
      { label: "Notifications", url: "/dash/settings/notifications", icon: Bell },
      { label: "Payments", url: "/dash/settings/payments", icon: Wallet },
      { label: "Security", url: "/dash/settings/security", icon: ShieldCheckIcon },
      { label: "Appearance", url: "/dash/settings/preference", icon: MonitorIcon },
      { label: "Billing", url: "/dash/settings/billing", icon: CreditCardIcon },
      { label: "Widget", url: "/dash/settings/widget", icon: Layout, badge: "Pro+" },
      { label: "Branding", url: "/dash/settings/branding", icon: Palette, badge: "Agency" },
      { label: "Domain", url: "/dash/settings/domain", icon: Globe, badge: "Agency" },
      { label: "Team", url: "/dash/settings/team", icon: Users },
    ],
  }
];

/**
 * Derived structures tailored to existing components.
 */

// Primary nav: Dashboard, Calendar, Bookings, Customers, Services, Staff, Coupons, Settings (expandable).
export const sidebarNavMain: {
  title: string;
  url: string;
  icon: React.ElementType;
  items?: { title: string; url: string; icon?: React.ElementType }[];
}[] = (NAV_MENUS.find((m) => m.id === "admin-sidebar")?.items ?? [])
  .filter((item) => item.url)
  .map((item) => ({
    title: item.label,
    url: item.url as string,
    icon: (item.icon ?? LayoutIcon) as React.ElementType,
    items:
      item.label === "Settings"
        ? NAV_MENUS.find((m) => m.id === "settings-tabs")?.items.map(
          (settingsItem) => ({
            title: settingsItem.label,
            url: settingsItem.url ?? "/dash/settings",
            icon: settingsItem.icon,
          })
        )
        : undefined,
  }));

// Schedule section: Availability, Blackouts (shown below primary nav with divider).
export const sidebarNavSchedule: {
  title: string;
  url: string;
  icon: React.ElementType;
}[] = (NAV_MENUS.find((m) => m.id === "admin-sidebar-schedule")?.items ?? [])
  .filter((item) => item.url)
  .map((item) => ({
    title: item.label,
    url: item.url as string,
    icon: (item.icon ?? UserCircle) as React.ElementType,
  }));

// Staff sidebar nav — derived from staff-sidebar (link items only).
export const sidebarNavStaff: {
  title: string;
  url: string;
  icon: React.ElementType;
  items?: {
    title: string;
    url: string;
    icon?: React.ElementType;
  }[];
}[] = (NAV_MENUS.find((m) => m.id === "staff-sidebar")?.items ?? [])
  .filter((item) => item.url)
  .map((item) => ({
    title: item.label,
    url: item.url as string,
    icon: (item.icon ?? UserCircle) as React.ElementType,
  }));

// Project list used in the sidebar footer; kept here so all
// nav-like structures live in one place.
export const sidebarProjects: {
  name: string;
  url: string;
  icon: typeof Frame;
}[] = [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ];

