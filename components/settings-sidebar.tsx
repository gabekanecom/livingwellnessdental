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

            {/* Mobile horizontal scroll with fade edges */}
            <div className="relative md:hidden">
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
              <ul className="flex flex-nowrap overflow-x-auto no-scrollbar mx-4 snap-x snap-mandatory pb-2">
                {links.map((link, index) => {
                  const isActive = link.matchPattern
                    ? new RegExp(link.matchPattern).test(pathname)
                    : link.href.endsWith("/profile") ||
                      link.href.match(/\/[^\/]+$/)
                    ? pathname === link.href
                    : pathname === link.href ||
                      pathname.startsWith(link.href + "/");

                  return (
                    <li key={index} className="mr-0.5 snap-start">
                      <Link
                        href={link.href}
                        className={`flex items-center px-3 py-2.5 rounded-lg whitespace-nowrap min-h-[44px] ${
                          isActive
                            ? "bg-violet-100 text-violet-600"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`shrink-0 fill-current mr-2 ${
                            isActive ? "text-violet-500" : "text-gray-400"
                          }`}
                        >
                          {link.icon}
                        </span>
                        <span className="text-sm font-medium">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Desktop vertical list */}
            <ul className="hidden md:block">
              {links.map((link, index) => {
                const isActive = link.matchPattern
                  ? new RegExp(link.matchPattern).test(pathname)
                  : link.href.endsWith("/profile") ||
                    link.href.match(/\/[^\/]+$/)
                  ? pathname === link.href
                  : pathname === link.href ||
                    pathname.startsWith(link.href + "/");

                return (
                  <li key={index} className="mb-0.5">
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
