import { hasPermission, getUserPermissions } from '@/lib/permissions';
import prisma from '@/lib/prisma';

// Permission IDs for wiki
export const WIKI_PERMISSIONS = {
  VIEW: 'wiki.view',
  CREATE: 'wiki.create',
  EDIT: 'wiki.edit',
  DELETE: 'wiki.delete',
  SUBMIT_FOR_REVIEW: 'wiki.submit_for_review',
  VIEW_REVIEW_QUEUE: 'wiki.view_review_queue',
  REVIEW_ARTICLES: 'wiki.review_articles',
  PUBLISH_DIRECTLY: 'wiki.publish_directly',
  ASSIGN_REVIEWERS: 'wiki.assign_reviewers',
} as const;

/**
 * Check if user can create articles
 */
export async function canCreateArticle(userId: string): Promise<boolean> {
  return hasPermission(userId, WIKI_PERMISSIONS.CREATE);
}

/**
 * Check if user can edit a specific article
 * User can edit if they are the author OR have wiki.edit permission
 */
export async function canEditArticle(userId: string, articleId: string): Promise<boolean> {
  // Check if user is the author
  const article = await prisma.wikiArticle.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });

  if (!article) return false;

  // Author can always edit their own articles
  if (article.authorId === userId) return true;

  // Otherwise check for wiki.edit permission
  return hasPermission(userId, WIKI_PERMISSIONS.EDIT);
}

/**
 * Check if user can delete a specific article
 * User can delete if they are the author OR have wiki.delete permission
 */
export async function canDeleteArticle(userId: string, articleId: string): Promise<boolean> {
  const article = await prisma.wikiArticle.findUnique({
    where: { id: articleId },
    select: { authorId: true },
  });

  if (!article) return false;

  // Author can delete their own articles
  if (article.authorId === userId) return true;

  // Otherwise check for wiki.delete permission
  return hasPermission(userId, WIKI_PERMISSIONS.DELETE);
}

/**
 * Check if user can submit articles for review
 */
export async function canSubmitForReview(userId: string): Promise<boolean> {
  return hasPermission(userId, WIKI_PERMISSIONS.SUBMIT_FOR_REVIEW);
}

/**
 * Check if user can view the review queue
 */
export async function canViewReviewQueue(userId: string): Promise<boolean> {
  return hasPermission(userId, WIKI_PERMISSIONS.VIEW_REVIEW_QUEUE);
}

/**
 * Check if user can approve/reject articles
 */
export async function canReviewArticles(userId: string): Promise<boolean> {
  return hasPermission(userId, WIKI_PERMISSIONS.REVIEW_ARTICLES);
}

/**
 * Check if user can publish directly (skip review)
 */
export async function canPublishDirectly(userId: string): Promise<boolean> {
  return hasPermission(userId, WIKI_PERMISSIONS.PUBLISH_DIRECTLY);
}

/**
 * Check if user can assign reviewers to articles
 */
export async function canAssignReviewers(userId: string): Promise<boolean> {
  return hasPermission(userId, WIKI_PERMISSIONS.ASSIGN_REVIEWERS);
}

/**
 * Get all users who have the ability to review articles
 * Used for sending notifications when articles are submitted for review
 */
export async function getReviewers(): Promise<Array<{ id: string; name: string; email: string }>> {
  // Find all users who have roles with wiki.review_articles permission
  const usersWithReviewPermission = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        // Users with roles that have the permission
        {
          userRoles: {
            some: {
              isActive: true,
              role: {
                permissions: {
                  some: {
                    permissionId: WIKI_PERMISSIONS.REVIEW_ARTICLES,
                    granted: true,
                  },
                },
              },
            },
          },
        },
        // Users with direct permission grants
        {
          userPermissions: {
            some: {
              permissionId: WIKI_PERMISSIONS.REVIEW_ARTICLES,
              granted: true,
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return usersWithReviewPermission;
}

/**
 * Check if a specific status transition is allowed for a user
 */
export async function canChangeStatus(
  userId: string,
  articleId: string,
  fromStatus: string,
  toStatus: string
): Promise<{ allowed: boolean; reason?: string }> {
  const article = await prisma.wikiArticle.findUnique({
    where: { id: articleId },
    select: { authorId: true, status: true },
  });

  if (!article) {
    return { allowed: false, reason: 'Article not found' };
  }

  // Verify current status matches
  if (article.status !== fromStatus) {
    return { allowed: false, reason: `Article is not in ${fromStatus} status` };
  }

  const isAuthor = article.authorId === userId;

  // DRAFT → IN_REVIEW: Author only + submit_for_review permission
  if (fromStatus === 'DRAFT' && toStatus === 'IN_REVIEW') {
    if (!isAuthor) {
      return { allowed: false, reason: 'Only the author can submit their article for review' };
    }
    const canSubmit = await canSubmitForReview(userId);
    if (!canSubmit) {
      return { allowed: false, reason: 'You do not have permission to submit articles for review' };
    }
    return { allowed: true };
  }

  // IN_REVIEW → PUBLISHED (approve): Requires review_articles permission
  if (fromStatus === 'IN_REVIEW' && toStatus === 'PUBLISHED') {
    const canReview = await canReviewArticles(userId);
    if (!canReview) {
      return { allowed: false, reason: 'You do not have permission to approve articles' };
    }
    return { allowed: true };
  }

  // IN_REVIEW → DRAFT (reject): Requires review_articles permission
  if (fromStatus === 'IN_REVIEW' && toStatus === 'DRAFT') {
    const canReview = await canReviewArticles(userId);
    if (!canReview) {
      return { allowed: false, reason: 'You do not have permission to reject articles' };
    }
    return { allowed: true };
  }

  // DRAFT → PUBLISHED (direct publish): Requires publish_directly permission
  if (fromStatus === 'DRAFT' && toStatus === 'PUBLISHED') {
    const canPublish = await canPublishDirectly(userId);
    if (!canPublish) {
      return { allowed: false, reason: 'You do not have permission to publish directly. Please submit for review.' };
    }
    return { allowed: true };
  }

  // Any → ARCHIVED: Author or has wiki.edit permission
  if (toStatus === 'ARCHIVED') {
    if (isAuthor) {
      return { allowed: true };
    }
    const canEdit = await hasPermission(userId, WIKI_PERMISSIONS.EDIT);
    if (!canEdit) {
      return { allowed: false, reason: 'You do not have permission to archive this article' };
    }
    return { allowed: true };
  }

  // ARCHIVED → DRAFT (restore): Author or has wiki.edit permission
  if (fromStatus === 'ARCHIVED' && toStatus === 'DRAFT') {
    if (isAuthor) {
      return { allowed: true };
    }
    const canEdit = await hasPermission(userId, WIKI_PERMISSIONS.EDIT);
    if (!canEdit) {
      return { allowed: false, reason: 'You do not have permission to restore this article' };
    }
    return { allowed: true };
  }

  // Cancel review (IN_REVIEW → DRAFT by author)
  if (fromStatus === 'IN_REVIEW' && toStatus === 'DRAFT' && isAuthor) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'This status transition is not allowed' };
}

/**
 * Get all wiki permissions for a user
 * Useful for UI to know what actions to show
 */
export async function getWikiPermissionsForUser(userId: string): Promise<{
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canSubmitForReview: boolean;
  canViewReviewQueue: boolean;
  canReviewArticles: boolean;
  canPublishDirectly: boolean;
  canAssignReviewers: boolean;
}> {
  const userPerms = await getUserPermissions(userId);
  const perms = userPerms.permissions;

  return {
    canView: perms.has(WIKI_PERMISSIONS.VIEW),
    canCreate: perms.has(WIKI_PERMISSIONS.CREATE),
    canEdit: perms.has(WIKI_PERMISSIONS.EDIT),
    canDelete: perms.has(WIKI_PERMISSIONS.DELETE),
    canSubmitForReview: perms.has(WIKI_PERMISSIONS.SUBMIT_FOR_REVIEW),
    canViewReviewQueue: perms.has(WIKI_PERMISSIONS.VIEW_REVIEW_QUEUE),
    canReviewArticles: perms.has(WIKI_PERMISSIONS.REVIEW_ARTICLES),
    canPublishDirectly: perms.has(WIKI_PERMISSIONS.PUBLISH_DIRECTLY),
    canAssignReviewers: perms.has(WIKI_PERMISSIONS.ASSIGN_REVIEWERS),
  };
}
