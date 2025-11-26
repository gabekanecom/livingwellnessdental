'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  theme: 'light' | 'dark';
  accent: string;
  position: 'left' | 'right';
  greeting: string;
}

export default function ChatWidgetFrame({ theme, accent, position, greeting }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const accentColor = `#${accent}`;
  const isDark = theme === 'dark';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notify parent of size changes
  useEffect(() => {
    window.parent.postMessage(
      {
        type: 'lwd-widget-resize',
        isOpen,
        height: isOpen ? 520 : 60,
        width: isOpen ? 380 : 60,
      },
      '*'
    );
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/widget/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.error,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: data.reply,
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I couldn't connect. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`h-screen w-screen flex ${position === 'left' ? 'justify-start' : 'justify-end'} items-end p-0`}
    >
      {/* Chat Window */}
      {isOpen && (
        <div
          className="mb-16 mr-0 w-[360px] h-[450px] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
          }}
        >
          {/* Header */}
          <div className="p-4 flex items-center gap-3" style={{ backgroundColor: accentColor }}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-sm">Living Wellness Dental</h3>
              <p className="text-white/80 text-xs">Ask us anything</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
          >
            {/* Greeting */}
            {messages.length === 0 && (
              <div className="flex justify-start">
                <div
                  className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2 text-sm"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#ffffff',
                    color: isDark ? '#f3f4f6' : '#1f2937',
                  }}
                >
                  {greeting}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                  }`}
                  style={
                    msg.role === 'user'
                      ? {
                          backgroundColor: accentColor,
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: isDark ? '#374151' : '#ffffff',
                          color: isDark ? '#f3f4f6' : '#1f2937',
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ backgroundColor: isDark ? '#374151' : '#ffffff' }}
                >
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: accentColor, animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: accentColor, animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full animate-bounce"
                      style={{ backgroundColor: accentColor, animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="p-3 border-t"
            style={{
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb',
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
                style={{
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  color: isDark ? '#f3f4f6' : '#1f2937',
                  border: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: accentColor }}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
