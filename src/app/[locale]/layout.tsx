import { Outfit } from 'next/font/google';
import './globals.css';
import {NextIntlClientProvider} from 'next-intl';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export default async function RootLayout({

  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <NextIntlClientProvider>
          <ThemeProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
