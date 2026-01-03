import type { Metadata } from "next";
import { Geist, Geist_Mono, Nunito, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ConditionalNavbar from "@/components/ConditionalNavbar";
import ConditionalFooter from "@/components/ConditionalFooter";
import { Toaster } from "react-hot-toast";

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

export const metadata: Metadata = {
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
  robots: {
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
    url: "https://soulparadisetravels.com/",
    siteName: "Soul Paradise Travels",
    title: "Soul Paradise Travels - Fuel Your Soul with Travel | Best Travel Agency in Jalandhar",
    description: "No matter where in the world you want to go, we can help get you there. Expert travel services including flights, tours, hotels, visa & insurance. 24/7 support available.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Soul Paradise Travels - Your Trusted Travel Partner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soul Paradise Travels - Best Travel Agency in Jalandhar, Punjab",
    description: "Affordable flight bookings, holiday packages, hotel reservations & visa services. 24/7 customer support. Book your dream vacation today!",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://soulparadisetravels.com/",
  },
  category: "Travel & Tourism",
  verification: {
    google: "your-google-verification-code-here",
  },
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


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} ${poppins.variable} antialiased`}>
        <AuthProvider>
          <ConditionalNavbar />
          {children}
          <ConditionalFooter />
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
