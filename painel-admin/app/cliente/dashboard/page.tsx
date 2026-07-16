"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UsuarioCliente = {
  nome: string;
  email: string;
  plano: string;
  expira_em: string | null;
};

export default function ClienteDashboardPage() {
  const router = useRouter();

  const [usuario, setUsuario] =
    useState<UsuarioCliente | null>(null);

  useEffect(() => {
    const usuarioSalvo =
      localStorage.getItem("usuario_cliente");

    if (!usuarioSalvo) {
      return;
    }

    try {
      setUsuario(JSON.parse(usuarioSalvo));
    } catch {
      setUsuario(null);
    }
  }, []);

  const premium =
    usuario?.plano === "mensal" ||
    usuario?.plano === "anual";

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:p-10">
      <header>
        <p className="text-sm font-medium text-blue-400">
          Visão geral
        </p>

        <h1 className="mt-2 break-words text-2xl font-semibold sm:text-3xl">
          Olá, {usuario?.nome ?? "cliente"}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Acompanhe as oportunidades e as informações da
          sua conta.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          titulo="Seu plano"
          valor={formatarPlano(usuario?.plano)}
          descricao={
            premium
              ? "Você possui acesso Premium"
              : "Conta gratuita"
          }
          destaque={premium ? "premium" : "neutro"}
        />

        <Card
          titulo="Oportunidades disponíveis"
          valor={premium ? "Todas" : "1"}
          descricao={
            premium
              ? "Acesso completo às oportunidades"
              : "Uma oportunidade gratuita"
          }
          destaque="info"
        />

        <Card
          titulo="Status da conta"
          valor="Ativa"
          descricao="Sua conta está liberada"
          destaque="sucesso"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:mt-8 sm:p-6">
        <h2 className="text-lg font-semibold">
          Bem-vindo ao Padrões B3
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          O sistema analisa padrões históricos em ações da
          B3 e apresenta oportunidades baseadas nos
          resultados dos backtests. Os dados apresentados
          não representam garantia de resultado e devem ser
          utilizados como apoio à análise.
        </p>

        {!premium && (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 sm:p-5">
            <h3 className="font-medium text-blue-200">
              Desbloqueie o acesso completo
            </h3>

            <p className="mt-2 text-sm leading-6 text-blue-300/80">
              Assine um plano mensal ou anual para visualizar
              todas as oportunidades disponíveis na
              plataforma.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cliente/dashboard/planos"
                )
              }
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 text-center text-sm font-medium transition hover:bg-blue-500 sm:w-auto"
            >
              Conhecer planos
            </button>
          </div>
        )}

        {premium && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 sm:p-5">
            <h3 className="font-medium text-emerald-200">
              Acesso Premium liberado
            </h3>

            <p className="mt-2 text-sm leading-6 text-emerald-300/80">
              Sua conta pode visualizar todas as
              oportunidades disponíveis enquanto a
              assinatura estiver ativa.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/cliente/dashboard/oportunidades"
                )
              }
              className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-center text-sm font-medium text-white transition hover:bg-emerald-500 sm:w-auto"
            >
              Ver oportunidades
            </button>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2">
        <AcaoCard
          titulo="Oportunidades"
          descricao="Consulte os sinais encontrados pelo scanner no candle mais recente."
          textoBotao="Acessar oportunidades"
          onClick={() =>
            router.push(
              "/cliente/dashboard/oportunidades"
            )
          }
        />

        <AcaoCard
          titulo="Minha conta"
          descricao="Consulte seus dados, plano, vencimento e altere sua senha."
          textoBotao="Ver minha conta"
          onClick={() =>
            router.push(
              "/cliente/dashboard/conta"
            )
          }
        />
      </section>

      <section className="mt-6 rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-4 sm:mt-8 sm:p-5">
        <h2 className="text-sm font-medium text-amber-200">
          Aviso importante
        </h2>

        <p className="mt-2 text-xs leading-5 text-amber-200/60 sm:text-sm sm:leading-6">
          As análises apresentadas utilizam dados históricos
          e não constituem recomendação de investimento.
          Resultados anteriores não garantem resultados
          futuros.
        </p>
      </section>
    </div>
  );
}

type DestaqueCard =
  | "premium"
  | "info"
  | "sucesso"
  | "neutro";

function Card({
  titulo,
  valor,
  descricao,
  destaque,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  destaque: DestaqueCard;
}) {
  const estilos: Record<
    DestaqueCard,
    {
      container: string;
      valor: string;
    }
  > = {
    premium: {
      container:
        "border-violet-500/20 bg-violet-500/[0.06]",
      valor: "text-violet-300",
    },
    info: {
      container:
        "border-blue-500/20 bg-blue-500/[0.06]",
      valor: "text-blue-300",
    },
    sucesso: {
      container:
        "border-emerald-500/20 bg-emerald-500/[0.06]",
      valor: "text-emerald-300",
    },
    neutro: {
      container:
        "border-white/10 bg-white/[0.03]",
      valor: "text-white",
    },
  };

  const estilo = estilos[destaque];

  return (
    <article
      className={`min-w-0 rounded-2xl border p-5 sm:p-6 ${estilo.container}`}
    >
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <p
        className={`mt-3 break-words text-2xl font-semibold capitalize sm:mt-4 sm:text-3xl ${estilo.valor}`}
      >
        {valor}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}

function AcaoCard({
  titulo,
  descricao,
  textoBotao,
  onClick,
}: {
  titulo: string;
  descricao: string;
  textoBotao: string;
  onClick: () => void;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <p className="text-sm font-medium text-white">
        {titulo}
      </p>

      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">
        {descricao}
      </p>

      <button
        type="button"
        onClick={onClick}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm text-slate-200 transition hover:bg-white/5 sm:w-fit"
      >
        {textoBotao}
      </button>
    </article>
  );
}

function formatarPlano(
  plano: string | undefined
) {
  const nomes: Record<string, string> = {
    gratis: "Grátis",
    mensal: "Mensal",
    anual: "Anual",
  };

  if (!plano) {
    return "...";
  }

  return nomes[plano] ?? plano;
}