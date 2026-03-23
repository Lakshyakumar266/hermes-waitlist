import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.hermesworkspace.com"),

  title: {
    default: "Hermes Workspace",
    template: "%s | Hermes Workspace",
  },

  description:
    "Hermes Workspace is an all-in-one communication and management platform for schools and organisations. Messaging, live sessions, and admin tools unified in one place.",

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
    title: "Hermes Workspace",
    description:
      "One workspace for every message, every decision. Built for schools and organisations.",
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
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
