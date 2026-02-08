// =====================================================
// ROOT LAYOUT
// =====================================================
// This is the root layout that wraps all pages
// It sets up Clerk authentication and global styles
// =====================================================


import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Flight Finder - Never Miss a Cheap Flight',
  description: 'Automated flight monitoring with instant alerts when prices match your budget',
};

export default function RootLayout({ children }) {
  return (
    
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    
  );
}
