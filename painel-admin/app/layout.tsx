```tsx
import type {
  Metadata,
  Viewport,
} from "next";

import type { ReactNode } from "react";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import Script from "next/script";

import DadosEstruturadosGlobais from "@/components/dados-estruturados-globais";

import "./globals.css";


const URL_PADRAO =
  "https://padroesb3.com.br";

const URL_SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  URL_PADRAO
).replace(/\/$/, "");


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});


const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});


export const metadata: Metadata = {
  metadataBase: new URL(URL_SITE),

  title: {
    default:
      "Padrões B3 | Oportunidades em ações brasileiras",

    template:
      "%s | Padrões B3",
  },

  description:
    "Monitore ações brasileiras e encontre oportunidades na Bolsa de Valores com análises estatísticas, backtests, taxa de acerto, retorno médio e alertas durante o pregão da B3.",

  applicationName:
    "Padrões B3",

  authors: [
    {
      name: "Padrões B3",
    },
  ],

  creator:
    "Padrões B3",

  publisher:
    "Padrões B3",

  category:
    "finance",

  keywords: [
    "Padrões B3",
    "ações brasileiras",
    "ações da B3",
    "Bolsa de Valores",
    "B3",
    "oportunidades na Bolsa",
    "scanner de ações",
    "análise de ações",
    "análise estatística",
    "backtest de ações",
    "mercado financeiro",
    "investimento em ações",
    "taxa de acerto",
    "retorno médio",
    "padrões estatísticos",
    "monitoramento de ações",
    "ferramenta para investidores",
    "oportunidades em ações",
    "análise quantitativa",
    "dados históricos da Bolsa",
  ],

  referrer:
    "origin-when-cross-origin",

  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },

  manifest:
    "/manifest.webmanifest",

  openGraph: {
    type: "website",

    locale: "pt_BR",

    url: URL_SITE,

    siteName:
      "Padrões B3",

    title:
      "Padrões B3 | Oportunidades em ações brasileiras",

    description:
      "Economize tempo acompanhando ações da B3. Consulte análises estatísticas com horários, taxa de acerto, retorno médio e histórico de ocorrências.",

    images: [
      {
        url:
          "/opengraph-image",

        width: 1200,

        height: 630,

        alt:
          "Padrões B3 — análise estatística de ações brasileiras",
      },
    ],
  },

  twitter: {
    card:
      "summary_large_image",

    title:
      "Padrões B3 | Oportunidades em ações brasileiras",

    description:
      "Scanner de ações brasileiras com análises estatísticas, backtests e alertas de oportunidades durante o pregão.",

    images: [
      "/opengraph-image",
    ],
  },

  robots: {
    index: true,

    follow: true,

    googleBot: {
      index: true,

      follow: true,

      "max-image-preview":
        "large",

      "max-snippet":
        -1,

      "max-video-preview":
        -1,
    },
  },

  icons: {
    icon: [
      {
        url:
          "/favicon.ico",

        type:
          "image/x-icon",
      },

      {
        url:
          "/favicon-96x96.png",

        sizes:
          "96x96",

        type:
          "image/png",
      },
    ],

    shortcut: [
      {
        url:
          "/favicon.ico",

        type:
          "image/x-icon",
      },
    ],

    apple: [
      {
        url:
          "/apple-touch-icon.png",

        sizes:
          "180x180",

        type:
          "image/png",
      },
    ],
  },
};


export const viewport: Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  maximumScale:
    5,

  themeColor:
    "#05070b",

  colorScheme:
    "dark",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >

      <body className="flex min-h-full flex-col overflow-x-hidden bg-[#05070b] text-white">

        {/* =====================================================
            GOOGLE ANALYTICS
        ====================================================== */}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-DXM2FQD9VE"
          strategy="afterInteractive"
        />

        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];

            function gtag() {
              dataLayer.push(arguments);
            }

            gtag('js', new Date());

            gtag('config', 'G-DXM2FQD9VE');
          `}
        </Script>


        {/* =====================================================
            FACEBOOK PIXEL
            ID: 1030131486497793
        ====================================================== */}

        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
        >
          {`
            !function(f,b,e,v,n,t,s)
            {
              if(f.fbq)return;

              n=f.fbq=function(){
                n.callMethod ?
                n.callMethod.apply(n,arguments) :
                n.queue.push(arguments)
              };

              if(!f._fbq)f._fbq=n;

              n.push=n;
              n.loaded=!0;
              n.version='2.0';
              n.queue=[];

              t=b.createElement(e);
              t.async=!0;
              t.src=v;

              s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(
              window,
              document,
              'script',
              'https://connect.facebook.net/en_US/fbevents.js'
            );

            fbq('init', '1030131486497793');

            fbq('track', 'PageView');
          `}
        </Script>


        {/* =====================================================
            FACEBOOK PIXEL — NOSCRIPT
        ====================================================== */}

        <noscript>
          <img
            height="1"
            width="1"
            style={{
              display: "none",
            }}
            src="https://www.facebook.com/tr?id=1030131486497793&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>


        {/* =====================================================
            DADOS ESTRUTURADOS GLOBAIS
        ====================================================== */}

        <DadosEstruturadosGlobais />


        {/* =====================================================
            CONTEÚDO DA APLICAÇÃO
        ====================================================== */}

        {children}

      </body>

    </html>
  );
}
```
