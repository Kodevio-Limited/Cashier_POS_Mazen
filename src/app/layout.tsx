import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cashier POS — Restaurant Ecosystem',
  description: 'Point of Sale system for restaurant cashiers.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
