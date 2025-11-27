'use client';

import { useState, useEffect } from 'react';
import { ListBulletIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractHeadings(html: string): TocItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headings = doc.querySelectorAll('h2, h3, h4');
  
  const items: TocItem[] = [];
  const idCounts: Record<string, number> = {};

  headings.forEach((heading) => {
    const text = heading.textContent?.trim() || '';
    if (!text) return;

    let id = heading.id || generateId(text);
    
    if (idCounts[id]) {
      idCounts[id]++;
      id = `${id}-${idCounts[id]}`;
    } else {
      idCounts[id] = 1;
    }

    const level = parseInt(heading.tagName.charAt(1));
    items.push({ id, text, level });
  });

  return items;
}

export default function TableOfContents({ content, className = '' }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const items = extractHeadings(content);
    setHeadings(items);

    const idCounts: Record<string, number> = {};
    const articleContent = document.querySelector('.prose');
    if (articleContent) {
      const headingElements = articleContent.querySelectorAll('h2, h3, h4');
      headingElements.forEach((heading) => {
        const text = heading.textContent?.trim() || '';
        if (!text) return;

        let id = generateId(text);
        if (idCounts[id]) {
          idCounts[id]++;
          id = `${id}-${idCounts[id]}`;
        } else {
          idCounts[id] = 1;
        }

        heading.id = id;
      });
    }
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  if (headings.length < 2) return null;

  return (
    <nav className={`${className}`}>
      <div className="sticky top-24">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-between w-full text-left mb-3 lg:cursor-default"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            <ListBulletIcon className="h-4 w-4" />
            <span>On this page</span>
          </div>
          <span className="lg:hidden">
            {isCollapsed ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronUpIcon className="h-4 w-4 text-gray-400" />
            )}
          </span>
        </button>

        <ul className={`space-y-1 ${isCollapsed ? 'hidden lg:block' : ''}`}>
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
            >
              <button
                onClick={() => handleClick(heading.id)}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                  activeId === heading.id
                    ? 'text-violet-700 bg-violet-50 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
