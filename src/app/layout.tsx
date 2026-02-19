import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'PikeNotes',
  description: 'Simple. Fast. Synced. A personal note-taking and to-do app.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PikeNotes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
};

// Blocking script to prevent theme flash — runs before any React hydration
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('pike-notes-theme') || 'light';
    if (theme === 'dark-gray') {
      theme = 'dark-dark-gray';
      localStorage.setItem('pike-notes-theme', theme);
    }
    document.documentElement.setAttribute('data-theme', theme);
    var colors = {
      'light': '#ffffff',
      'light-contrast': '#ffffff',
      'dark-light-gray': '#2a2a2e',
      'dark-dark-gray': '#1a1a1a',
      'dark-slate': '#1a1f2e'
    };
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[theme] || '#ffffff');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
