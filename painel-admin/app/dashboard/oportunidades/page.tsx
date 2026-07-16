"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/app/services/api";

type Oportunidade = {
  id: number;
  acao: string;
  estrategia: string;
  horario_compra: string;
  horario_venda: string;
  horizonte_saida: number;
  taxa_acerto: number;
  ocorrencias: number;
  acertos: number;
  falhas: number;
  retorno_medio: number;
  score: number;
  tipo_acesso: string;
  data_geracao: string;
};

type RespostaOportunidades = {
  quantidade: number;
  total_historico: number;
  oportunidades: Oportunidade[];
};

export default function OportunidadesPage() {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [totalHistorico, setTotalHistorico] = useState(0);
  const [pesquisa, setPesquisa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarOportunidades = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch<RespostaOportunidades>(
        "/admin/oportunidades"
      );

      setOportunidades(resposta.oportunidades);
      setTotalHistorico(resposta.total_historico);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar as oportunidades."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarOportunidades();
  }, [carregarOportunidades]);

  const oportunidadesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) {
      return oportunidades;
    }

    return oportunidades.filter((oportunidade) => {
      return (
        oportunidade.acao.toLowerCase().includes(termo) ||
        oportunidade.estrategia.toLowerCase().includes(termo)
      );
    });
  }, [oportunidades, pesquisa]);

  const melhorTaxa =
    oportunidades.length > 0
      ? Math.max(
          ...oportunidades.map(
            (oportunidade) => oportunidade.taxa_acerto
          )
        )
      : 0;

  const melhorRetorno =
    oportunidades.length > 0
      ? Math.max(
          ...oportunidades.map(
            (oportunidade) => oportunidade.retorno_medio
          )
        )
      : 0;

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Scanner de mercado
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Oportunidades
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Padrões aprovados que estão acontecendo no candle mais recente.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarOportunidades}
          disabled={carregando}
          className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? "Atualizando..." : "Atualizar scanner"}
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Oportunidades ativas"
          valor={carregando ? "..." : oportunidades.length}
          descricao="Encontradas na última execução"
        />

        <CardResumo
          titulo="Melhor taxa de acerto"
          valor={
            carregando
              ? "..."
              : `${formatarDecimal(melhorTaxa)}%`
          }
          descricao="Maior taxa entre as oportunidades"
        />

        <CardResumo
          titulo="Melhor retorno médio"
          valor={
            carregando
              ? "..."
              : `${formatarDecimal(melhorRetorno)}%`
          }
          descricao="Maior retorno médio histórico"
        />

        <CardResumo
          titulo="Histórico acumulado"
          valor={carregando ? "..." : totalHistorico}
          descricao="Oportunidades registradas anteriormente"
        />
      </div>

      {erro && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-semibold text-white">
              Oportunidades atuais
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {oportunidadesFiltradas.length} oportunidade(s)
            </p>
          </div>

          <input
            type="search"
            value={pesquisa}
            onChange={(evento) => setPesquisa(evento.target.value)}
            placeholder="Pesquisar ação ou estratégia"
            className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 lg:max-w-sm"
          />
        </div>

        {carregando ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

              <p className="mt-4 text-sm text-slate-500">
                Consultando o scanner...
              </p>
            </div>
          </div>
        ) : oportunidadesFiltradas.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center p-8 text-center">
            <div className="max-w-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-xl text-slate-400">
                B3
              </div>

              <h3 className="mt-5 font-medium text-slate-200">
                Nenhuma oportunidade ativa
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nenhum dos padrões aprovados está acontecendo no
                candle mais recente. O scanner continuará procurando
                novas oportunidades.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 p-5 xl:grid-cols-2">
            {oportunidadesFiltradas.map((oportunidade, indice) => (
              <CardOportunidade
                key={oportunidade.id ?? `${oportunidade.acao}-${indice}`}
                oportunidade={oportunidade}
                posicao={indice + 1}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type CardResumoProps = {
  titulo: string;
  valor: string | number;
  descricao: string;
};

function CardResumo({
  titulo,
  valor,
  descricao,
}: CardResumoProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{titulo}</p>

      <p className="mt-3 text-3xl font-semibold text-white">
        {valor}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {descricao}
      </p>
    </article>
  );
}

type CardOportunidadeProps = {
  oportunidade: Oportunidade;
  posicao: number;
};

function CardOportunidade({
  oportunidade,
  posicao,
}: CardOportunidadeProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-semibold text-white">
              {posicao}º
            </span>

            <h3 className="text-xl font-semibold text-white">
              {oportunidade.acao}
            </h3>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-300">
            {oportunidade.estrategia}
          </p>
        </div>

        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Score {formatarDecimal(oportunidade.score)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info
          titulo="Comprar"
          valor={oportunidade.horario_compra}
        />

        <Info
          titulo="Vender"
          valor={`${oportunidade.horario_venda} (+${oportunidade.horizonte_saida})`}
        />

        <Info
          titulo="Taxa de acerto"
          valor={`${formatarDecimal(oportunidade.taxa_acerto)}%`}
        />

        <Info
          titulo="Retorno médio"
          valor={`${formatarDecimal(oportunidade.retorno_medio)}%`}
        />

        <Info
          titulo="Ocorrências"
          valor={oportunidade.ocorrencias}
        />

        <Info
          titulo="Resultado histórico"
          valor={`${oportunidade.acertos} acertos / ${oportunidade.falhas} falhas`}
        />
      </div>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-xs text-slate-600">
          Gerada em {formatarData(oportunidade.data_geracao)}
        </p>
      </div>
    </article>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-2 text-sm font-medium text-slate-200">
        {valor}
      </p>
    </div>
  );
}

function formatarDecimal(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatarData(dataTexto: string) {
  if (!dataTexto) {
    return "Data não informada";
  }

  const data = new Date(dataTexto.replace(" ", "T"));

  if (Number.isNaN(data.getTime())) {
    return dataTexto;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}