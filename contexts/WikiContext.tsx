'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WikiCategory, WikiArticle, WikiSearchResult } from '@/lib/wiki/types';

interface WikiContextType {
  categories: WikiCategory[];
  setCategories: (categories: WikiCategory[]) => void;
  currentCategory: WikiCategory | null;
  setCurrentCategory: (category: WikiCategory | null) => void;
  currentArticle: WikiArticle | null;
  setCurrentArticle: (article: WikiArticle | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: WikiSearchResult[];
  setSearchResults: (results: WikiSearchResult[]) => void;
  isSearching: boolean;
  setIsSearching: (isSearching: boolean) => void;
  recentArticles: WikiArticle[];
  addToRecentArticles: (article: WikiArticle) => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  expandedCategories: Set<string>;
  toggleCategoryExpanded: (categoryId: string) => void;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

export function WikiProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<WikiCategory[]>([]);
  const [currentCategory, setCurrentCategory] = useState<WikiCategory | null>(null);
  const [currentArticle, setCurrentArticle] = useState<WikiArticle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WikiSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentArticles, setRecentArticles] = useState<WikiArticle[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const addToRecentArticles = useCallback((article: WikiArticle) => {
    setRecentArticles(prev => {
      const filtered = prev.filter(a => a.id !== article.id);
      return [article, ...filtered].slice(0, 5);
    });
  }, []);

  const toggleCategoryExpanded = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  return (
    <WikiContext.Provider
      value={{
        categories,
        setCategories,
        currentCategory,
        setCurrentCategory,
        currentArticle,
        setCurrentArticle,
        searchQuery,
        setSearchQuery,
        searchResults,
        setSearchResults,
        isSearching,
        setIsSearching,
        recentArticles,
        addToRecentArticles,
        sidebarExpanded,
        setSidebarExpanded,
        expandedCategories,
        toggleCategoryExpanded,
      }}
    >
      {children}
    </WikiContext.Provider>
  );
}

export function useWiki() {
  const context = useContext(WikiContext);
  if (context === undefined) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
}
