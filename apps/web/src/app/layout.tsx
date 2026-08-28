import type { Metadata } from 'next';
import './globals.css';
import { ToastContainer } from '../components/ui/ToastContainer';
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata: Metadata = {
  title: 'Co-work — Enterprise Collaboration & Workspace',
  description:
    'Modern company workspace with real-time messaging, file sharing, team directories, and activity dashboard.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-client-id';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('cowork_theme') || 'dark';
                if (theme === 'system') {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
          <ToastContainer />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
