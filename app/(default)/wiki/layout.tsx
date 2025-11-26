import { WikiProvider } from '@/contexts/WikiContext';
import WikiSidebar from '@/components/wiki/WikiSidebar';
import WikiChatWidget from '@/components/wiki/WikiChatWidget';

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <WikiProvider>
      <div className="flex min-h-screen bg-gray-50">
        <WikiSidebar />
        <main className="flex-1">{children}</main>
      </div>
      <WikiChatWidget />
    </WikiProvider>
  );
}
