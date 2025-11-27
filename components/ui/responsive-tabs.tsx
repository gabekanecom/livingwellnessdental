'use client';

import { Fragment } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ResponsiveTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function ResponsiveTabs({ tabs, activeTab, onChange, className = '' }: ResponsiveTabsProps) {
  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={className}>
      {/* Mobile: Dropdown selector */}
      <div className="sm:hidden mb-4">
        <label htmlFor="mobile-tab-select" className="sr-only">
          Select a tab
        </label>
        <select
          id="mobile-tab-select"
          className="block w-full rounded-lg border-gray-300 py-2.5 pl-3 pr-10 text-base focus:border-violet-500 focus:outline-none focus:ring-violet-500"
          value={activeTab}
          onChange={(e) => onChange(e.target.value)}
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: Tab bar */}
      <div className="hidden sm:block border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
