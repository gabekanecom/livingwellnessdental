'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookmarkIcon as BookmarkOutline,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface LessonToolsProps {
  lessonId: string;
  lessonTitle: string;
}

export default function LessonTools({ lessonId, lessonTitle }: LessonToolsProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoadingBookmark, setIsLoadingBookmark] = useState(false);
  const [note, setNote] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchBookmarkStatus();
    fetchNote();
  }, [lessonId]);

  const fetchBookmarkStatus = async () => {
    try {
      const response = await fetch(`/api/lms/bookmarks?lessonId=${lessonId}`);
      if (response.ok) {
        const data = await response.json();
        setIsBookmarked(data.isBookmarked);
      }
    } catch (error) {
      console.error('Error fetching bookmark:', error);
    }
  };

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/lms/notes?lessonId=${lessonId}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data.note?.content || '');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };

  const toggleBookmark = async () => {
    setIsLoadingBookmark(true);
    try {
      if (isBookmarked) {
        const response = await fetch(`/api/lms/bookmarks?lessonId=${lessonId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIsBookmarked(false);
          toast.success('Bookmark removed');
        }
      } else {
        const response = await fetch('/api/lms/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId })
        });
        if (response.ok) {
          setIsBookmarked(true);
          toast.success('Lesson bookmarked');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsLoadingBookmark(false);
    }
  };

  const saveNote = useCallback(async () => {
    if (!note.trim()) return;
    
    setIsSavingNote(true);
    try {
      const response = await fetch('/api/lms/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, content: note })
      });
      if (response.ok) {
        setHasUnsavedChanges(false);
        toast.success('Note saved');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  }, [lessonId, note]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(() => {
      saveNote();
    }, 2000);

    return () => clearTimeout(timer);
  }, [note, hasUnsavedChanges, saveNote]);

  const handleNoteChange = (value: string) => {
    setNote(value);
    setHasUnsavedChanges(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleBookmark}
          disabled={isLoadingBookmark}
          className={`p-2 rounded-lg transition-colors ${
            isBookmarked 
              ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
        >
          {isBookmarked ? (
            <BookmarkSolid className="h-5 w-5" />
          ) : (
            <BookmarkOutline className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={() => setIsNoteOpen(true)}
          className={`p-2 rounded-lg transition-colors ${
            note ? 'text-violet-500 bg-violet-50 hover:bg-violet-100' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="Add notes"
        >
          <PencilSquareIcon className="h-5 w-5" />
        </button>
      </div>

      {isNoteOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="font-semibold text-gray-900">Lesson Notes</h3>
                <p className="text-sm text-gray-500 truncate max-w-xs">{lessonTitle}</p>
              </div>
              <button
                onClick={() => {
                  if (hasUnsavedChanges) {
                    saveNote();
                  }
                  setIsNoteOpen(false);
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={note}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Write your notes here... They will auto-save."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {isSavingNote ? 'Saving...' : hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
              </span>
              <button
                onClick={() => {
                  saveNote();
                  setIsNoteOpen(false);
                }}
                disabled={isSavingNote}
                className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
