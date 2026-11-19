import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import { SiteImagesProvider } from "@/components/SiteImages";
import { getSiteContent, hasImage } from "@/lib/site-content";
import { Toaster } from "react-hot-toast";
import StagingBanner from "@/components/StagingBanner";
import { IS_STAGING, SITE_URL, STAGING_BANNER_HEIGHT } from "@/lib/app-env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  style: ["normal", "italic"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const baseMetadata: Metadata = {
  title: "Soul Paradise Travels - Best Travel Agency in Jalandhar, Punjab | International & Domestic Flight Bookings",
  description: "Soul Paradise Travels offers affordable flight bookings, holiday packages, hotel reservations, visa services & travel insurance. 24/7 customer support. Located in Jalandhar, Punjab. Book your dream vacation today!",
  keywords: [
    "travel agency Jalandhar",
    "flight booking Punjab",
    "international flights",
    "domestic flights",
    "holiday packages India",
    "hotel booking",
    "tourist visa services",
    "travel insurance",
    "budget travel packages",
    "Soul Paradise Travels",
    "tour packages India",
    "affordable travel agency",
    "IATA certified travel agent"
  ],
  authors: [{ name: "Soul Paradise Travels" }],
  creator: "Soul Paradise Travels",
  publisher: "Soul Paradise Travels",
  metadataBase: new URL(SITE_URL),
  // The staging copy must never be indexed (next.config.ts also sends
  // X-Robots-Tag and app/robots.ts disallows everything there).
  robots: IS_STAGING
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: `${SITE_URL}/`,
    siteName: "Soul Paradise Travels",
    title: "Soul Paradise Travels - Fuel Your Soul with Travel | Best Travel Agency in Jalandhar",
    description: "No matter where in the world you want to go, we can help get you there. Expert travel services including flights, tours, hotels, visa & insurance. 24/7 support available.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soul Paradise Travels - Best Travel Agency in Jalandhar, Punjab",
    description: "Affordable flight bookings, holiday packages, hotel reservations & visa services. 24/7 customer support. Book your dream vacation today!",
  },
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  category: "Travel & Tourism",
  // Only emit the Search Console meta tag when a real code is configured.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  other: {
    "contact:phone_number": "+91-987-681-6688",
    "contact:email": "soulparadise21@gmail.com",
    "business:contact_data:street_address": "Shop No. 21, 1st Floor, PPR Plaza",
    "business:contact_data:locality": "Jalandhar",
    "business:contact_data:region": "Punjab",
    "business:contact_data:postal_code": "144001",
    "business:contact_data:country_name": "India",
  },
};


/** Share image = the logo from the media library, when one is set. */
export async function generateMetadata(): Promise<Metadata> {
  const { global } = await getSiteContent("global");
  const logo = global.images?.logo;
  if (!hasImage(logo)) return baseMetadata;
  return {
    ...baseMetadata,
    openGraph: { ...baseMetadata.openGraph, images: [{ url: logo, alt: "Soul Paradise Travels" }] },
    twitter: { ...baseMetadata.twitter, images: [logo] },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site-wide footer copy + contact details (admin panel → Site Content).
  const { global } = await getSiteContent("global");
  return (
    <html
      lang="en"
      style={IS_STAGING ? ({ "--staging-h": STAGING_BANNER_HEIGHT } as React.CSSProperties) : undefined}
    >
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${poppins.variable} antialiased`}>
        <StagingBanner />
        <AuthProvider>
          <PreferencesProvider>
            <SiteImagesProvider images={global.images}>
              <ConditionalNavbar />
              {children}
              <ConditionalFooter global={global} />
            </SiteImagesProvider>
          </PreferencesProvider>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
