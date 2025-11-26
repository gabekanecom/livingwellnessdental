export const WIKI_CONFIG = {
  ARTICLE_EXCERPT_LENGTH: 200,
  SEARCH_RESULTS_PER_PAGE: 20,
  ARTICLES_PER_PAGE: 20,
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  READING_SPEED_WPM: 200, // words per minute for reading time estimate
};

export const CATEGORY_ICONS = {
  general: 'BookOpenIcon',
  hr: 'UsersIcon',
  operations: 'CogIcon',
  clinical: 'HeartIcon',
  training: 'AcademicCapIcon',
  policies: 'DocumentTextIcon',
  safety: 'ShieldCheckIcon',
  technology: 'ComputerDesktopIcon',
};

export const EDITOR_EXTENSIONS = [
  'bold',
  'italic',
  'underline',
  'strike',
  'heading',
  'bulletList',
  'orderedList',
  'taskList',
  'blockquote',
  'codeBlock',
  'table',
  'image',
  'link',
  'highlight',
];
