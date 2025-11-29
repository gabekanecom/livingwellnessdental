'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import ResizableImageExtension from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import Youtube from '@tiptap/extension-youtube';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useState, useCallback, useRef } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  CodeBracketIcon,
  PhotoIcon,
  LinkIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import UnifiedMediaModal from '@/components/media/UnifiedMediaModal';

// Custom numbered list icon
const NumberedListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12" />
    <text x="3" y="8" fontSize="5" fontWeight="600" fill="currentColor" stroke="none">1</text>
    <text x="3" y="13.5" fontSize="5" fontWeight="600" fill="currentColor" stroke="none">2</text>
    <text x="3" y="19" fontSize="5" fontWeight="600" fill="currentColor" stroke="none">3</text>
  </svg>
);

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function ArticleEditor({ content, onChange, placeholder }: ArticleEditorProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing your article...',
      }),
      ResizableImageExtension.configure({
        inline: false,
        allowBase64: true,
      } as any),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-violet-600 hover:text-violet-800 underline',
        },
      }),
      Highlight,
      Typography,
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg',
        },
        width: 640,
        height: 360,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files.length) {
          const files = Array.from(event.dataTransfer.files);
          const images = files.filter(file => file.type.startsWith('image/'));

          if (images.length > 0) {
            event.preventDefault();
            // Open media modal - user will upload there
            setShowMediaModal(true);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              // Open media modal - user will upload there
              setShowMediaModal(true);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Actual drop handling is in editorProps.handleDrop
  }, []);

  const setLink = () => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter link URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().setLink({ href: url }).run();
  };

  const addVideo = () => {
    if (!editor || !videoUrl) return;

    editor.commands.setYoutubeVideo({
      src: videoUrl,
    });

    setVideoUrl('');
    setShowVideoModal(false);
  };

  const handleMediaSelect = (url: string, alt?: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url, alt: alt || '' }).run();
  };

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-lg overflow-hidden animate-pulse">
        <div className="bg-gray-50 border-b border-gray-300 p-2 h-12" />
        <div className="min-h-[500px] bg-gray-50" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Unified Media Modal */}
      <UnifiedMediaModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={handleMediaSelect}
        module="wiki"
      />

      {/* Video embed modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Embed Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Paste a YouTube URL to embed a video.
            </p>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && videoUrl) {
                  addVideo();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addVideo}
                disabled={!videoUrl}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
              >
                Embed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-violet-50/90 border-2 border-dashed border-violet-400 rounded-lg">
          <div className="text-center">
            <PhotoIcon className="h-12 w-12 text-violet-600 mx-auto mb-2" />
            <p className="text-violet-700 font-medium">Drop images here</p>
          </div>
        </div>
      )}

      <div
        className={`border rounded-lg overflow-hidden transition-colors ${
          isDragging ? 'border-violet-400' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Toolbar */}
        <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <BoldIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <ItalicIcon className="h-5 w-5" />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 font-semibold text-sm ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 font-semibold text-sm ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            title="Heading 3"
          >
            H3
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
            title="Bullet List"
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
            title="Numbered List"
          >
            <NumberedListIcon />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('codeBlock') ? 'bg-gray-300' : ''}`}
            title="Code Block"
          >
            <CodeBracketIcon className="h-5 w-5" />
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          {/* Insert Image button - opens unified media modal */}
          <button
            type="button"
            onClick={() => setShowMediaModal(true)}
            className="p-2 rounded hover:bg-gray-200"
            title="Insert Image"
          >
            <PhotoIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowVideoModal(true)}
            className="p-2 rounded hover:bg-gray-200"
            title="Embed Video"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={setLink}
            className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
            title="Add Link (Ctrl+K)"
          >
            <LinkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Editor content */}
        <EditorContent editor={editor} />

        {/* Help text */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
          Drag and drop images, or paste from clipboard. Supports YouTube embeds.
        </div>
      </div>
    </div>
  );
}
