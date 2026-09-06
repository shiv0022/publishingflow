import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'PublishingFlow - Simple Social Media Posting',
  description: 'Minimal private social media posting for Instagram, Facebook, and YouTube',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="app-shell">
            <Navbar />
            <main>{children}</main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
