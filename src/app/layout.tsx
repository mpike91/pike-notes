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
    if (theme === 'dark-dark-gray' || theme === 'dark-light-gray') {
      theme = 'dark-gray';
      localStorage.setItem('pike-notes-theme', theme);
    } else if (theme === 'light-contrast') {
      theme = 'light';
      localStorage.setItem('pike-notes-theme', theme);
    }
    document.documentElement.setAttribute('data-theme', theme);
    var colors = {
      'light': '#eaebec',
      'dark-gray': '#18181c',
      'dark-slate': '#10141c',
      'dark-wine': '#110d0f',
      'dark-moss': '#0f130f'
    };
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', colors[theme] || '#eaebec');
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
