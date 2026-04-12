import './globals.css';

import { Geist_Mono, Noto_Sans, Nunito_Sans } from 'next/font/google';

import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const notoSansHeading = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
});

const nunitoSans = Nunito_Sans({ subsets: ['latin'], variable: '--font-sans' });

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'antialiased',
        fontMono.variable,
        'font-sans',
        nunitoSans.variable,
        notoSansHeading.variable
      )}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
