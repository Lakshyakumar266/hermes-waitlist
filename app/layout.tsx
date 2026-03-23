import type { Metadata, Viewport } from "next";
import { SpeedInsights } from '@vercel/speed-insights/next';

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hermesworkspace.com"),

  title: {
    default:
      "Hermes Workspace - Waitlist – All-in-One Communication Platform for Organisations and Schools",
    template: "%s | Hermes Workspace",
  },

  description:
    "Hermes Workspace is an all-in-one communication and management platform for organisationsand schools. Messaging, live sessions, announcements, and admin tools unified in one powerful workspace.",
  keywords: [
    "Hermes Workspace",
    "school communication platform",
    "education SaaS India",
    "student teacher communication",
    "school management software",
    "productivity SaaS",
  ],

  authors: [{ name: "Hermes Workspace" }],
  creator: "Hermes Workspace",

  openGraph: {
    title: "Hermes Workspace: Waitlist",
    description:
      "All-in-one communication and management platform for organisations. Messaging, live sessions, and admin tools unified in one workspace.",
      
    url: "https://www.hermesworkspace.com",
    siteName: "Hermes Workspace",
    images: [
      {
        url: "https://www.hermesworkspace.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Hermes Workspace",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Hermes Workspace",
    description: "All-in-one communication & management platform for schools.",
    images: ["/opengraph-image"],
  },

  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },

  alternates: {
    canonical: "https://www.hermesworkspace.com",
  },
};

export const viewport: Viewport = {
  themeColor: "#090909",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
