import React from "react";
import {
  UserGroupIcon,
  MapPinIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { SidebarLink } from "./settings-sidebar";

export const wikiLinks: SidebarLink[] = [
  {
    href: "/wiki",
    label: "Browse",
    icon: <BookOpenIcon className="h-5 w-5" />,
    matchPattern: "^/wiki$",
  },
  {
    href: "/wiki/article/new",
    label: "New Article",
    icon: <PlusCircleIcon className="h-5 w-5" />,
  },
];

export const adminSettingsLinks: SidebarLink[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: <Cog6ToothIcon className="h-5 w-5" />,
    matchPattern: "^/admin$",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: <UserGroupIcon className="h-5 w-5" />,
  },
  {
    href: "/admin/locations",
    label: "Locations",
    icon: <MapPinIcon className="h-5 w-5" />,
  },
  {
    href: "/admin/user-types",
    label: "User Types & Roles",
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    href: "/admin/branding",
    label: "Branding",
    icon: <PaintBrushIcon className="h-5 w-5" />,
  },
];
