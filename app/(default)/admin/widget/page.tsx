import { Metadata } from 'next';
import WidgetSettings from './WidgetSettings';

export const metadata: Metadata = {
  title: 'Chat Widget - Admin',
  description: 'Configure the embeddable chat widget for your website',
};

export default function WidgetPage() {
  return (
    <div className="p-6">
      <WidgetSettings />
    </div>
  );
}
