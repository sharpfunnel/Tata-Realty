"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { META_PIXEL_ID, trackPixelPageView } from "../lib/meta/pixel";

/**
 * Meta Pixel loader.
 *
 * A client component rather than a bare <Script> because it has two jobs the
 * server cannot do: keep the pixel off /admin (our own traffic must not land in
 * the ad data), and re-fire PageView on client-side navigation, which the
 * snippet only does for the first render.
 *
 * Renders nothing when NEXT_PUBLIC_META_PIXEL_ID is unset, so an environment
 * without the id ships no snippet at all.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;
  const enabled = Boolean(META_PIXEL_ID) && !isAdmin;

  // The inline snippet fires the first PageView itself, so remember the path
  // this mounted on and report only the navigations that follow it.
  const initialPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (initialPathRef.current === null) {
      initialPathRef.current = pathname;
      return;
    }
    if (initialPathRef.current === pathname) return;
    trackPixelPageView();
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('trackSingle','${META_PIXEL_ID}','PageView');`,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
