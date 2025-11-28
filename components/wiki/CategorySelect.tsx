'use client';

import { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface CategorySelectProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CategorySelect({
  categories,
  selectedIds,
  onChange,
  placeholder = 'Select categories...',
  required = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategories = selectedIds
    .map(id => categories.find(c => c.id === id))
    .filter(Boolean) as Category[];

  const filteredCategories = categories.filter(
    cat =>
      !selectedIds.includes(cat.id) &&
      cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (categoryId: string) => {
    onChange([...selectedIds, categoryId]);
    setSearch('');
    inputRef.current?.focus();
  };

  const handleRemove = (categoryId: string) => {
    onChange(selectedIds.filter(id => id !== categoryId));
  };

  const handleMakePrimary = (categoryId: string) => {
    // Move the category to the front (primary position)
    const newIds = [categoryId, ...selectedIds.filter(id => id !== categoryId)];
    onChange(newIds);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !search && selectedIds.length > 0) {
      // Remove last selected category on backspace
      onChange(selectedIds.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Enter' && filteredCategories.length > 0) {
      e.preventDefault();
      handleSelect(filteredCategories[0].id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Main container styled like an input */}
      <div
        className={`min-h-[42px] px-3 py-2 border rounded-lg bg-white cursor-text flex flex-wrap items-center gap-2 transition-colors ${
          isOpen
            ? 'border-violet-500 ring-2 ring-violet-500/20'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Selected category pills */}
        {selectedCategories.map((cat, index) => (
          <span
            key={cat.id}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm ${
              index === 0
                ? 'bg-violet-100 text-violet-800 border border-violet-200'
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            {cat.icon && <span className="text-xs">{cat.icon}</span>}
            <span>{cat.name}</span>
            {index === 0 && selectedIds.length > 1 && (
              <span className="text-[10px] font-medium text-violet-600 ml-0.5">
                Primary
              </span>
            )}
            {index !== 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMakePrimary(cat.id);
                }}
                className="text-gray-400 hover:text-violet-600 ml-0.5"
                title="Make primary"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(cat.id);
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedIds.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-gray-400"
        />

        {/* Dropdown toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredCategories.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {search
                ? 'No matching categories'
                : selectedIds.length === categories.length
                ? 'All categories selected'
                : 'No categories available'}
            </div>
          ) : (
            <ul className="py-1">
              {filteredCategories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(cat.id)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-violet-50 flex items-center gap-2 transition-colors"
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span className="flex-1">{cat.name}</span>
                    {selectedIds.includes(cat.id) && (
                      <CheckIcon className="h-4 w-4 text-violet-600" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Helper text */}
      {selectedIds.length > 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          {selectedIds.length === 1
            ? '1 category selected'
            : `${selectedIds.length} categories selected · First is primary`}
        </p>
      )}
      {required && selectedIds.length === 0 && (
        <p className="mt-1.5 text-xs text-gray-500">
          Select at least one category
        </p>
      )}
    </div>
  );
}
