'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  DocumentMagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface Review {
  id: string;
  status: string;
  submittedAt: string;
  feedback: string | null;
  article: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    status: string;
    category: { name: string } | null;
  };
  submittedBy: {
    id: string;
    name: string;
    avatar: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
}

export default function ReviewQueuePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    checkPermissions();
    fetchReviews();
  }, [statusFilter]);

  async function checkPermissions() {
    try {
      const res = await fetch('/api/wiki/permissions');
      if (res.ok) {
        const data = await res.json();
        setHasPermission(data.permissions?.canViewReviewQueue || false);
        setCanReview(data.permissions?.canReviewArticles || false);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`/api/wiki/reviews?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else if (res.status === 403) {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reviewId: string) {
    setProcessing(reviewId);
    try {
      const res = await fetch(`/api/wiki/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to approve article');
      }
    } catch (error) {
      console.error('Error approving article:', error);
      alert('Failed to approve article');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(reviewId: string) {
    if (!rejectFeedback.trim()) {
      alert('Please provide feedback for the author');
      return;
    }

    setProcessing(reviewId);
    try {
      const res = await fetch(`/api/wiki/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', feedback: rejectFeedback }),
      });

      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setRejectModalOpen(null);
        setRejectFeedback('');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to reject article');
      }
    } catch (error) {
      console.error('Error rejecting article:', error);
      alert('Failed to reject article');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-32 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You do not have permission to view the review queue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DocumentMagnifyingGlassIcon className="h-6 w-6 text-violet-600" />
              <h1 className="text-2xl font-bold text-gray-900">Review Queue</h1>
            </div>
            <p className="text-gray-500">
              Review and approve articles submitted for publication
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-sm rounded-lg border-gray-300"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {review.article.title}
                    </h2>
                    {review.status === 'IN_PROGRESS' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        In Progress
                      </span>
                    )}
                  </div>
                  {review.article.excerpt && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {review.article.excerpt}
                    </p>
                  )}
                  <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                    {review.article.category && (
                      <span className="text-violet-600 font-medium">
                        {review.article.category.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <UserCircleIcon className="h-4 w-4" />
                      {review.submittedBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Submitted {formatDistanceToNow(new Date(review.submittedAt), { addSuffix: true })}
                    </span>
                    {review.assignedTo && (
                      <span className="text-blue-600">
                        Assigned to: {review.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/wiki/article/${review.article.slug}`}
                    target="_blank"
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <EyeIcon className="h-4 w-4" />
                    Preview
                  </Link>
                  {canReview && (
                    <>
                      <button
                        onClick={() => {
                          setRejectModalOpen(review.id);
                          setRejectFeedback('');
                        }}
                        disabled={processing === review.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(review.id)}
                        disabled={processing === review.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reject Modal */}
              {rejectModalOpen === review.id && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Reject Article
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Please provide feedback for the author explaining why this article needs revision.
                    </p>
                    <textarea
                      value={rejectFeedback}
                      onChange={(e) => setRejectFeedback(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      placeholder="Explain what changes are needed..."
                    />
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setRejectModalOpen(null);
                          setRejectFeedback('');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(review.id)}
                        disabled={processing === review.id || !rejectFeedback.trim()}
                        className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processing === review.id ? 'Rejecting...' : 'Reject Article'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No articles pending review</h3>
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'No articles have been submitted for review yet.'
              : `No ${statusFilter.toLowerCase().replace('_', ' ')} reviews. Check back later!`}
          </p>
        </div>
      )}
    </div>
  );
}
