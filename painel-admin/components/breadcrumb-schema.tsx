"use client";

type ItemBreadcrumb = {
  nome: string;
  caminho: string;
};

type BreadcrumbSchemaProps = {
  itens: ItemBreadcrumb[];
};

const URL_PADRAO = "http://localhost:3000";

function obterUrlSite() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    URL_PADRAO
  ).replace(/\/$/, "");
}

function criarUrlCompleta(
  urlSite: string,
  caminho: string
) {
  if (
    caminho.startsWith("http://") ||
    caminho.startsWith("https://")
  ) {
    return caminho;
  }

  const caminhoNormalizado = caminho.startsWith("/")
    ? caminho
    : `/${caminho}`;

  return `${urlSite}${caminhoNormalizado}`;
}

function escaparJsonLd(valor: unknown) {
  return JSON.stringify(valor).replace(
    /</g,
    "\\u003c"
  );
}

export default function BreadcrumbSchema({
  itens,
}: BreadcrumbSchemaProps) {
  const urlSite = obterUrlSite();

  if (itens.length === 0) {
    return null;
  }

  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: itens.map(
      (item, indice) => ({
        "@type": "ListItem",
        position: indice + 1,
        name: item.nome,
        item: criarUrlCompleta(
          urlSite,
          item.caminho
        ),
      })
    ),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: escaparJsonLd(
          dadosEstruturados
        ),
      }}
    />
  );
}