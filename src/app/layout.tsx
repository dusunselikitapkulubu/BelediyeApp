import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AppShell from '@/components/layout/AppShell';
import PushProvider from '@/components/layout/PushProvider';
import AuthProvider from '@/components/layout/AuthProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BelediyeApp - Belediye Talep Sistemi',
  description: 'Belediyenize istek, öneri, şikayet ve bilgi taleplerinizi kolayca iletin.',
  applicationName: 'BelediyeApp',
  authors: [{ name: 'BelediyeApp' }],
  keywords: ['belediye', 'talep', 'şikayet', 'istek', 'e-devlet'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BelediyeApp',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    siteName: 'BelediyeApp',
    title: 'BelediyeApp',
    description: 'Belediyenize kolayca ulaşın',
  },
  twitter: { card: 'summary', title: 'BelediyeApp' },
};

export const viewport: Viewport = {
  themeColor: '#1a4f8a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gray-50 antialiased">
        <AuthProvider>
          <PushProvider>
            <AppShell>{children}</AppShell>
          </PushProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '10px',
              background: '#1a4f8a',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}