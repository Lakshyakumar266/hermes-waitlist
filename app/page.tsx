import type { Metadata } from "next";
import HomePage from "../components/home";

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
        url: "/og.png", // create this
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
    images: ["/og.png"],
  },

  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },

  alternates: {
    canonical: "https://www.hermesworkspace.com",
  },

  themeColor: "#090909",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Hermes Workspace",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description:
              "All-in-one communication and management platform for schools and organisations.",
            url: "https://www.hermesworkspace.com",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "INR",
            },
          }),
        }}
      />

      <HomePage />
    </>
  );
}
