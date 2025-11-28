import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: string;
  actionUrl?: string;
}

/**
 * Create a single notification
 */
export async function createNotification(data: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      actionUrl: data.actionUrl,
    },
  });
}

/**
 * Create notifications for multiple users with the same content
 */
export async function createNotifications(
  userIds: string[],
  data: Omit<CreateNotificationInput, 'userId'>
): Promise<void> {
  if (userIds.length === 0) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      actionUrl: data.actionUrl,
    })),
  });
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options || {};

  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}

/**
 * Get count of unread notifications for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Delete all read notifications for a user (cleanup)
 */
export async function deleteReadNotifications(userId: string): Promise<void> {
  await prisma.notification.deleteMany({
    where: {
      userId,
      isRead: true,
    },
  });
}

// Wiki-specific notification helpers

/**
 * Notify reviewers when an article is submitted for review
 */
export async function notifyReviewersOfSubmission(
  article: { id: string; title: string; slug: string },
  submittedBy: { id: string; name: string },
  reviewerIds: string[]
): Promise<void> {
  await createNotifications(reviewerIds.filter((id) => id !== submittedBy.id), {
    type: 'ARTICLE_SUBMITTED_FOR_REVIEW',
    title: 'New Article Awaiting Review',
    message: `${submittedBy.name} has submitted "${article.title}" for review.`,
    referenceType: 'article',
    referenceId: article.id,
    actionUrl: `/wiki/review`,
  });
}

/**
 * Notify a reviewer when they are assigned to review an article
 */
export async function notifyReviewerOfAssignment(
  article: { id: string; title: string; slug: string },
  reviewId: string,
  assignee: { id: string },
  assignedBy: { name: string }
): Promise<void> {
  await createNotification({
    userId: assignee.id,
    type: 'ARTICLE_REVIEW_ASSIGNED',
    title: 'Article Review Assigned',
    message: `${assignedBy.name} has assigned you to review "${article.title}".`,
    referenceType: 'review',
    referenceId: reviewId,
    actionUrl: `/wiki/review/${reviewId}`,
  });
}

/**
 * Notify author when their article is approved
 */
export async function notifyAuthorOfApproval(
  article: { id: string; title: string; slug: string },
  authorId: string,
  approvedBy: { name: string }
): Promise<void> {
  await createNotification({
    userId: authorId,
    type: 'ARTICLE_APPROVED',
    title: 'Article Approved',
    message: `Your article "${article.title}" has been approved and published by ${approvedBy.name}.`,
    referenceType: 'article',
    referenceId: article.id,
    actionUrl: `/wiki/article/${article.slug}`,
  });
}

/**
 * Notify author when their article is rejected
 */
export async function notifyAuthorOfRejection(
  article: { id: string; title: string; slug: string },
  authorId: string,
  rejectedBy: { name: string },
  feedback?: string
): Promise<void> {
  const feedbackMessage = feedback
    ? ` Feedback: "${feedback}"`
    : ' Please review the feedback and make revisions.';

  await createNotification({
    userId: authorId,
    type: 'ARTICLE_REJECTED',
    title: 'Article Needs Revision',
    message: `Your article "${article.title}" was returned by ${rejectedBy.name}.${feedbackMessage}`,
    referenceType: 'article',
    referenceId: article.id,
    actionUrl: `/wiki/my-articles`,
  });
}
