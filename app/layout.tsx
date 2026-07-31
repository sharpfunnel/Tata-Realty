import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GTM_ID = "GTM-T6FD9C6L";

// The `opsz` axis lets one family serve as Inter Display (headings) and Inter (body).
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tata Realty Ghansoli - Pre-Launch 2 & 3 BHK, Navi Mumbai",
  description:
    "Premium 2 & 3 BHK residences within a 47.5-acre integrated campus at Ghansoli, Navi Mumbai - Taj Hotel, IT Park, and open green views in one address.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      {/* Google Tag Manager */}
      <Script id="gtm-base" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      {/* End Google Tag Manager */}
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}

        {/* First-party analytics — feeds the /admin panel. Loaded after
            interaction so it never competes with the hero render. */}
        <Script src="/tracker.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
