import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobEdit — Resume Intelligence for Director-Level Professionals',
  description: 'Score, edit, and optimize your resume against any job description. Zero fluff. All signal.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
