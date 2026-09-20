import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'PublishingFlow — Social Media Manager',
  description: 'Manage your Facebook & Instagram accounts, posts, and auto-replies in one place',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <AppProvider>
          <Sidebar />
          <div className="sidebar-main-content">
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
