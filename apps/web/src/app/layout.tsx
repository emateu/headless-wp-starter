import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Analytics } from "~/components/layout/analytics";
import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { labels } from "~/lib/config/labels";
import { getLayoutData } from "~/lib/graphql/queries/get-layout-data";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: labels.site.name,
  description: labels.site.fallbackDescription,
};

async function HeaderWithData() {
  const { mainMenu, siteSettings } = await getLayoutData();
  return <Header menuItems={mainMenu} siteSettings={siteSettings} />;
}

async function FooterWithData() {
  const { footerMenu, siteSettings } = await getLayoutData();
  return <Footer menuItems={footerMenu} siteSettings={siteSettings} />;
}

function HeaderSkeleton() {
  return <div className="h-14 border-b bg-background/95" />;
}

function FooterSkeleton() {
  return <div className="h-24 border-t bg-muted/40" />;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} font-sans`}
    >
      <body className="min-h-full flex flex-col">
        <Analytics />
        <Suspense fallback={<HeaderSkeleton />}>
          <HeaderWithData />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={<FooterSkeleton />}>
          <FooterWithData />
        </Suspense>
      </body>
    </html>
  );
}
