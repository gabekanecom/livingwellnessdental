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
      accent={params.accent || '3ec972'} // success green from branding
      position={params.position || 'right'}
      greeting={params.greeting || 'Hi! How can I help you today?'}
    />
  );
}
