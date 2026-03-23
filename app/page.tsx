import HomePage from "../components/home";


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
