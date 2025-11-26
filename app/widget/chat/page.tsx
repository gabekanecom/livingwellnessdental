import ChatWidgetFrame from './ChatWidgetFrame';

export const metadata = {
  title: 'Chat Widget',
  robots: 'noindex, nofollow',
};

interface PageProps {
  searchParams: Promise<{
    theme?: 'light' | 'dark';
    accent?: string;
    position?: 'left' | 'right';
    greeting?: string;
  }>;
}

export default async function WidgetPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <ChatWidgetFrame
      theme={params.theme || 'light'}
      accent={params.accent || '7c3aed'} // violet-600
      position={params.position || 'right'}
      greeting={params.greeting || 'Hi! How can I help you today?'}
    />
  );
}
