export interface WikiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  parent?: WikiCategory;
  children?: WikiCategory[];
  articles?: WikiArticle[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiArticleCategory {
  category: WikiCategory;
  isPrimary: boolean;
}

export interface WikiArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  contentPlain: string;
  excerpt?: string;
  coverImage?: string;
  status: ArticleStatus;
  categories?: WikiArticleCategory[];
  authorId: string;
  author?: User;
  tags?: WikiTag[];
  versions?: WikiArticleVersion[];
  views: number;
  order: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WikiArticleVersion {
  id: string;
  articleId: string;
  title: string;
  content: string;
  authorId: string;
  author?: User;
  createdAt: Date;
}

export interface WikiTag {
  id: string;
  name: string;
  slug: string;
}

export interface WikiSearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryName: string;
  categorySlug: string;
  highlights?: string[];
  score: number;
}

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}
