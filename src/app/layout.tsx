import React, { JSX } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ossix Pipeline - Deployment Dashboard',
  description: 'Modern, real-time deployment management for your applications. Deploy, monitor, and manage multiple projects across staging and production environments.',
  keywords: ['deployment', 'devops', 'dashboard', 'pipeline', 'ossix', 'automation'],
  authors: [{ name: 'Ossix Technologies' }],
  creator: 'Ossix Technologies',
  publisher: 'Ossix Technologies',
  
  // Open Graph / Social Media
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pipeline.ossix.com',
    title: 'Ossix Pipeline - Deployment Dashboard',
    description: 'Modern deployment management dashboard with real-time monitoring',
    siteName: 'Ossix Pipeline',
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'Ossix Pipeline Logo',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Ossix Pipeline - Deployment Dashboard',
    description: 'Modern deployment management dashboard with real-time monitoring',
    images: ['/android-chrome-512x512.png'],
    creator: '@ossixtech',
  },

  // Icons and Favicons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { 
        rel: 'icon', 
        url: '/android-chrome-192x192.png', 
        sizes: '192x192', 
        type: 'image/png' 
      },
      { 
        rel: 'icon', 
        url: '/android-chrome-512x512.png', 
        sizes: '512x512', 
        type: 'image/png' 
      }
    ]
  },

  // Web App Manifest
  manifest: '/site.webmanifest',

  // Theme and App Behavior
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
  colorScheme: 'dark light',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },

  // App-specific
  applicationName: 'Ossix Pipeline',
  referrer: 'origin-when-cross-origin',
  category: 'technology',
  classification: 'DevOps Tool',

  // Robots and SEO
  robots: {
    index: false, // Since this is an internal tool
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Additional Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ossix Pipeline" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#0f172a" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-900`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}