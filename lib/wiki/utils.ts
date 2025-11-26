import slugify from 'slugify';
import { WIKI_CONFIG } from './constants';

export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function calculateReadingTime(content: string): number {
  const plainText = stripHtml(content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount / WIKI_CONFIG.READING_SPEED_WPM);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function generateExcerpt(content: string, length = WIKI_CONFIG.ARTICLE_EXCERPT_LENGTH): string {
  const plainText = stripHtml(content);
  if (plainText.length <= length) return plainText;
  return plainText.substring(0, length).trim() + '...';
}

export function extractHeadings(html: string): { level: number; text: string; id: string }[] {
  const headingRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;
  const headings: { level: number; text: string; id: string }[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[3],
      id: match[2],
    });
  }

  return headings;
}

export function buildCategoryTree(categories: any[]): any[] {
  const map = new Map();
  const roots: any[] = [];

  categories.forEach(cat => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach(cat => {
    const node = map.get(cat.id);
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function flattenCategoryTree(tree: any[], depth = 0): any[] {
  const result: any[] = [];

  tree.forEach(node => {
    result.push({ ...node, depth });
    if (node.children?.length) {
      result.push(...flattenCategoryTree(node.children, depth + 1));
    }
  });

  return result;
}
