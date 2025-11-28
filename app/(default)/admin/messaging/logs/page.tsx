'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface EmailMessage {
  id: string;
  to: string;
  from: string;
  subject: string;
  status: string;
  resendId: string | null;
  templateId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  error: string | null;
  createdAt: string;
}

interface SmsMessage {
  id: string;
  to: string;
  from: string;
  content: string;
  status: string;
  twilioSid: string | null;
  templateId: string | null;
  segments: number;
  sentAt: string | null;
  deliveredAt: string | null;
  error: string | null;
  createdAt: string;
}

type MessageType = 'all' | 'email' | 'sms';
type StatusFilter = 'all' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'pending';

export default function MessageLogsPage() {
  const [emailMessages, setEmailMessages] = useState<EmailMessage[]>([]);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messageType, setMessageType] = useState<MessageType>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailPage, setEmailPage] = useState(1);
  const [smsPage, setSmsPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | SmsMessage | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const [emailRes, smsRes] = await Promise.all([
        fetch('/api/admin/messaging/logs?type=email&limit=100'),
        fetch('/api/admin/messaging/logs?type=sms&limit=100'),
      ]);

      if (emailRes.ok) {
        const data = await emailRes.json();
        setEmailMessages(data.messages || []);
      }

      if (smsRes.ok) {
        const data = await smsRes.json();
        setSmsMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load message logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'bounced':
        return <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'bounced':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterMessages = <T extends { to: string; status: string }>(messages: T[]) => {
    return messages.filter((msg) => {
      if (statusFilter !== 'all' && msg.status.toLowerCase() !== statusFilter) {
        return false;
      }
      if (searchQuery && !msg.to.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  };

  const filteredEmails = filterMessages(emailMessages);
  const filteredSms = filterMessages(smsMessages);

  const paginatedEmails = filteredEmails.slice((emailPage - 1) * pageSize, emailPage * pageSize);
  const paginatedSms = filteredSms.slice((smsPage - 1) * pageSize, smsPage * pageSize);

  const totalEmailPages = Math.ceil(filteredEmails.length / pageSize);
  const totalSmsPages = Math.ceil(filteredSms.length / pageSize);

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/admin/messaging" className="hover:text-violet-600 flex items-center gap-1">
            <ArrowLeftIcon className="h-4 w-4" />
            Messaging
          </Link>
          <span>/</span>
          <span>Message Logs</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Message Logs</h1>
            <p className="text-gray-500 mt-1">
              View sent emails and SMS messages with delivery status
            </p>
          </div>
          <button
            onClick={fetchMessages}
            className="btn border-gray-200 hover:border-gray-300 text-gray-600 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Type:</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['all', 'email', 'sms'] as MessageType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMessageType(type)}
                  className={`px-3 py-1.5 text-sm ${
                    messageType === type
                      ? 'bg-violet-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'email' ? 'Email' : 'SMS'}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="form-select py-1.5 text-sm"
            >
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="bounced">Bounced</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by recipient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input w-full py-1.5 text-sm"
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{filteredEmails.length} emails</span>
            <span>{filteredSms.length} SMS</span>
          </div>
        </div>
      </div>

      {/* Email Messages */}
      {(messageType === 'all' || messageType === 'email') && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <EnvelopeIcon className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-medium text-gray-800">Email Messages</h2>
            <span className="text-sm text-gray-500">({filteredEmails.length})</span>
          </div>

          {paginatedEmails.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <EnvelopeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No email messages found</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedEmails.map((msg) => (
                    <tr
                      key={msg.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedMessage(msg);
                        setShowDetail(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {msg.to}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                        {msg.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(msg.status)}`}>
                          {getStatusIcon(msg.status)}
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(msg.sentAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(msg.deliveredAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalEmailPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {emailPage} of {totalEmailPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEmailPage(p => Math.max(1, p - 1))}
                      disabled={emailPage === 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setEmailPage(p => Math.min(totalEmailPages, p + 1))}
                      disabled={emailPage === totalEmailPages}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* SMS Messages */}
      {(messageType === 'all' || messageType === 'sms') && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <DevicePhoneMobileIcon className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-medium text-gray-800">SMS Messages</h2>
            <span className="text-sm text-gray-500">({filteredSms.length})</span>
          </div>

          {paginatedSms.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <DevicePhoneMobileIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No SMS messages found</p>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Segments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedSms.map((msg) => (
                    <tr
                      key={msg.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedMessage(msg);
                        setShowDetail(true);
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {msg.to}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs">
                        {msg.content.substring(0, 50)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(msg.status)}`}>
                          {getStatusIcon(msg.status)}
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {msg.segments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(msg.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalSmsPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {smsPage} of {totalSmsPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSmsPage(p => Math.max(1, p - 1))}
                      disabled={smsPage === 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSmsPage(p => Math.min(totalSmsPages, p + 1))}
                      disabled={smsPage === totalSmsPages}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedMessage && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowDetail(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                {'subject' in selectedMessage ? (
                  <><EnvelopeIcon className="h-5 w-5 text-blue-500" /> Email Details</>
                ) : (
                  <><DevicePhoneMobileIcon className="h-5 w-5 text-purple-500" /> SMS Details</>
                )}
              </h2>

              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">To</dt>
                  <dd className="text-sm text-gray-800 font-mono">{selectedMessage.to}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">From</dt>
                  <dd className="text-sm text-gray-800">{selectedMessage.from}</dd>
                </div>
                {'subject' in selectedMessage && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">Subject</dt>
                    <dd className="text-sm text-gray-800">{selectedMessage.subject}</dd>
                  </div>
                )}
                {'content' in selectedMessage && (
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">Content</dt>
                    <dd className="text-sm text-gray-800 bg-gray-50 rounded p-3">
                      {selectedMessage.content}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                      {getStatusIcon(selectedMessage.status)}
                      {selectedMessage.status}
                    </span>
                  </dd>
                </div>
                {'segments' in selectedMessage && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Segments</dt>
                    <dd className="text-sm text-gray-800">{selectedMessage.segments}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Sent At</dt>
                  <dd className="text-sm text-gray-800">{formatDate(selectedMessage.sentAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Delivered At</dt>
                  <dd className="text-sm text-gray-800">{formatDate(selectedMessage.deliveredAt)}</dd>
                </div>
                {'openedAt' in selectedMessage && selectedMessage.openedAt && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Opened At</dt>
                    <dd className="text-sm text-gray-800">{formatDate(selectedMessage.openedAt)}</dd>
                  </div>
                )}
                {selectedMessage.error && (
                  <div>
                    <dt className="text-sm text-red-500 mb-1">Error</dt>
                    <dd className="text-sm text-red-600 bg-red-50 rounded p-2">
                      {selectedMessage.error}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetail(false)}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
