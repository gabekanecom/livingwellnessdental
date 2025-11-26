"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export type SidebarLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchPattern?: string;
};

export type BackLink = {
  href: string;
  label: string;
};

export type SidebarProps = {
  title: string;
  links: SidebarLink[];
  backLink?: BackLink;
};

export default function SettingsSidebar({
  title,
  links,
  backLink,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="w-full md:w-56 lg:w-72 mb-8 md:mb-0">
      <div className="md:sticky md:top-16 md:h-[calc(100dvh-64px)] md:min-h-screen md:overflow-x-hidden md:overflow-y-auto no-scrollbar">
        <div className="md:py-8 md:border-r border-gray-200 h-full">
          <div className="md:px-8 lg:px-10 md:mb-6">
            {backLink && (
              <div className="md:hidden mb-4 ml-4">
                <Link
                  href={backLink.href}
                  className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-violet-600"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{backLink.label}</span>
                </Link>
              </div>
            )}

            <div className="text-xs font-semibold text-gray-400 uppercase mb-3">
              {title}
            </div>

            <ul className="flex flex-nowrap md:block overflow-x-auto no-scrollbar mx-4 md:mx-0">
              {links.map((link, index) => {
                const isActive = link.matchPattern
                  ? new RegExp(link.matchPattern).test(pathname)
                  : link.href.endsWith("/profile") ||
                    link.href.match(/\/[^\/]+$/)
                  ? pathname === link.href
                  : pathname === link.href ||
                    pathname.startsWith(link.href + "/");

                return (
                  <li key={index} className="mr-0.5 md:mr-0 md:mb-0.5">
                    <Link
                      href={link.href}
                      className={`flex items-center px-2.5 py-2 rounded-lg whitespace-nowrap ${
                        isActive &&
                        "bg-linear-to-r from-violet-500/[0.12] to-violet-500/[0.04]"
                      }`}
                    >
                      <span
                        className={`shrink-0 fill-current mr-2 ${
                          isActive
                            ? "text-violet-500"
                            : "text-gray-400"
                        }`}
                      >
                        {link.icon}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-violet-500"
                            : "text-gray-600 hover:text-gray-700"
                        }`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
