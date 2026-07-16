const URL_PADRAO = "http://localhost:3000";

function obterUrlSite() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    URL_PADRAO
  ).replace(/\/$/, "");
}

function obterEmailContato() {
  return (
    process.env.NEXT_PUBLIC_EMAIL_CONTATO ??
    "contato@padroesb3.com.br"
  )
    .trim()
    .toLowerCase();
}

function escaparJsonLd(valor: unknown) {
  return JSON.stringify(valor).replace(
    /</g,
    "\\u003c"
  );
}

export default function DadosEstruturadosGlobais() {
  const urlSite = obterUrlSite();
  const emailContato = obterEmailContato();

  const idOrganizacao =
    `${urlSite}/#organizacao`;

  const idSite =
    `${urlSite}/#website`;

  const idAplicacao =
    `${urlSite}/#software`;

  const organizacao = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": idOrganizacao,

    name: "Padrões B3",
    alternateName: "PB3",

    url: urlSite,

    logo: {
      "@type": "ImageObject",
      url: `${urlSite}/web-app-manifest-512x512.png`,
      width: 512,
      height: 512,
    },

    image:
      `${urlSite}/opengraph-image`,

    description:
      "Plataforma de análise estatística de ações brasileiras com backtests, scanner de mercado e oportunidades baseadas em padrões históricos da B3.",

    email: emailContato,

    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: emailContato,
      availableLanguage: [
        "Portuguese",
      ],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": idSite,

    name: "Padrões B3",
    alternateName: "PB3",

    url: urlSite,

    description:
      "Scanner de ações brasileiras com análises estatísticas, backtests, taxa de acerto, retorno médio e oportunidades durante o pregão da B3.",

    inLanguage: "pt-BR",

    publisher: {
      "@id": idOrganizacao,
    },
  };

  const aplicacao = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": idAplicacao,

    name: "Padrões B3",
    alternateName: "PB3",

    url: urlSite,

    applicationCategory:
      "FinanceApplication",

    applicationSubCategory:
      "Análise estatística de ações",

    operatingSystem: "Web",

    inLanguage: "pt-BR",

    description:
      "Plataforma web que analisa padrões históricos, executa backtests e monitora oportunidades em ações brasileiras negociadas na B3.",

    image:
      `${urlSite}/opengraph-image`,

    publisher: {
      "@id": idOrganizacao,
    },

    featureList: [
      "Scanner automático de ações brasileiras",
      "Backtests de padrões históricos",
      "Taxa de acerto histórica",
      "Retorno médio histórico",
      "Horários de compra e venda",
      "Quantidade de ocorrências, acertos e falhas",
      "Alertas de oportunidades por e-mail",
      "Painel responsivo para celulares e computadores",
    ],

    offers: [
      {
        "@type": "Offer",
        name: "Plano Grátis",
        price: "0",
        priceCurrency: "BRL",
        availability:
          "https://schema.org/InStock",
        url:
          `${urlSite}/cliente/cadastro`,
      },
      {
        "@type": "Offer",
        name: "Premium Mensal",
        price: "20.00",
        priceCurrency: "BRL",
        availability:
          "https://schema.org/InStock",
        url:
          `${urlSite}/cliente/cadastro`,
      },
      {
        "@type": "Offer",
        name: "Premium Anual",
        price: "180.00",
        priceCurrency: "BRL",
        availability:
          "https://schema.org/InStock",
        url:
          `${urlSite}/cliente/cadastro`,
      },
    ],
  };

  return (
    <>
      <script
        id="schema-organizacao"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escaparJsonLd(
            organizacao
          ),
        }}
      />

      <script
        id="schema-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escaparJsonLd(
            website
          ),
        }}
      />

      <script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escaparJsonLd(
            aplicacao
          ),
        }}
      />
    </>
  );
}