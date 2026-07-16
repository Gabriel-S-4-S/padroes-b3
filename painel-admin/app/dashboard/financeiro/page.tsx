"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { apiFetch } from "@/app/services/api";

type ReceitaMensal = {
  mes_numero: number;
  mes: string;
  valor_centavos: number;
};

type ResumoFinanceiro = {
  ano: number;

  receita_hoje_centavos: number;
  receita_mes_centavos: number;
  receita_total_centavos: number;

  usuarios_total: number;
  premium_mensal: number;
  premium_anual: number;
  gratuitos: number;

  cadastros: number;
  assinaturas: number;
  taxa_conversao: number;

  receita_mensal: ReceitaMensal[];
};

type TooltipReceitaProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: ReceitaMensal;
  }>;
  label?: string;
};

export default function FinanceiroPage() {
  const anoAtual = new Date().getFullYear();

  const [anoSelecionado, setAnoSelecionado] =
    useState(anoAtual);

  const [resumo, setResumo] =
    useState<ResumoFinanceiro | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarFinanceiro = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta =
        await apiFetch<ResumoFinanceiro>(
          `/admin/financeiro/resumo?ano=${anoSelecionado}`
        );

      setResumo(resposta);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível carregar os dados financeiros."
      );
    } finally {
      setCarregando(false);
    }
  }, [anoSelecionado]);

  useEffect(() => {
    carregarFinanceiro();
  }, [carregarFinanceiro]);

  const anosDisponiveis = useMemo(() => {
    const anos: number[] = [];

    for (
      let ano = anoAtual;
      ano >= anoAtual - 5;
      ano -= 1
    ) {
      anos.push(ano);
    }

    return anos;
  }, [anoAtual]);

  const receitaMensal = useMemo(() => {
    if (!resumo) {
      return [];
    }

    return resumo.receita_mensal.map((item) => ({
      ...item,
      valor_reais: item.valor_centavos / 100,
    }));
  }, [resumo]);

  const receitaMediaMensal = useMemo(() => {
    if (!resumo) {
      return 0;
    }

    const mesesComReceita =
      resumo.receita_mensal.filter(
        (item) => item.valor_centavos > 0
      );

    if (mesesComReceita.length === 0) {
      return 0;
    }

    const total = mesesComReceita.reduce(
      (acumulado, item) =>
        acumulado + item.valor_centavos,
      0
    );

    return total / mesesComReceita.length;
  }, [resumo]);

  return (
    <div className="p-6 lg:p-10">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Administração
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Financeiro
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Acompanhe receitas, assinaturas, usuários e a
            taxa de conversão da plataforma.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={anoSelecionado}
            onChange={(evento) =>
              setAnoSelecionado(
                Number(evento.target.value)
              )
            }
            disabled={carregando}
            aria-label="Selecionar ano do gráfico"
            className="h-11 rounded-xl border border-white/10 bg-[#0b0f17] px-4 text-sm text-slate-300 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={carregarFinanceiro}
            disabled={carregando}
            className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregando
              ? "Atualizando..."
              : "Atualizar dados"}
          </button>
        </div>
      </header>

      {erro && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {erro}
        </div>
      )}

      <section className="mt-8">
        <TituloSecao
          titulo="Receita"
          descricao="Valores de pagamentos reais aprovados e processados."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <CardFinanceiro
            titulo="Receita hoje"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo?.receita_hoje_centavos ?? 0
                  )
            }
            descricao="Pagamentos aprovados hoje"
            destaque="emerald"
          />

          <CardFinanceiro
            titulo="Receita no mês"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo?.receita_mes_centavos ?? 0
                  )
            }
            descricao="Total recebido no mês atual"
            destaque="blue"
          />

          <CardFinanceiro
            titulo="Receita total"
            valor={
              carregando
                ? "..."
                : formatarMoeda(
                    resumo?.receita_total_centavos ?? 0
                  )
            }
            descricao="Receita acumulada da plataforma"
            destaque="violet"
          />

          <CardFinanceiro
            titulo="Média mensal"
            valor={
              carregando
                ? "..."
                : formatarMoeda(receitaMediaMensal)
            }
            descricao={`Média dos meses com receita em ${anoSelecionado}`}
            destaque="amber"
          />
        </div>
      </section>

      <section className="mt-10">
        <TituloSecao
          titulo="Usuários"
          descricao="Distribuição atual das contas cadastradas."
        />

        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <CardNumero
            titulo="Total de usuários"
            valor={
              carregando
                ? "..."
                : resumo?.usuarios_total ?? 0
            }
            descricao="Todas as contas cadastradas"
          />

          <CardNumero
            titulo="Premium mensal"
            valor={
              carregando
                ? "..."
                : resumo?.premium_mensal ?? 0
            }
            descricao="Contas mensais ativas"
          />

          <CardNumero
            titulo="Premium anual"
            valor={
              carregando
                ? "..."
                : resumo?.premium_anual ?? 0
            }
            descricao="Contas anuais ativas"
          />

          <CardNumero
            titulo="Gratuitos"
            valor={
              carregando
                ? "..."
                : resumo?.gratuitos ?? 0
            }
            descricao="Contas no plano gratuito"
          />
        </div>
      </section>

      <section className="mt-10">
        <TituloSecao
          titulo="Conversão"
          descricao="Relação entre cadastros e clientes que já realizaram pagamento."
        />

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <CardNumero
            titulo="Cadastros"
            valor={
              carregando
                ? "..."
                : resumo?.cadastros ?? 0
            }
            descricao="Total de contas criadas"
          />

          <CardNumero
            titulo="Assinaturas"
            valor={
              carregando
                ? "..."
                : resumo?.assinaturas ?? 0
            }
            descricao="Usuários com pagamento aprovado"
          />

          <CardNumero
            titulo="Taxa de conversão"
            valor={
              carregando
                ? "..."
                : formatarPercentual(
                    resumo?.taxa_conversao ?? 0
                  )
            }
            descricao="Assinaturas em relação aos cadastros"
          />
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-blue-400">
              Evolução financeira
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Receita mensal de {anoSelecionado}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Soma dos pagamentos reais aprovados em cada
              mês.
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 sm:text-right">
            <p className="text-xs uppercase tracking-wider text-slate-600">
              Total no ano
            </p>

            <p className="mt-1 text-lg font-semibold text-white">
              {carregando
                ? "..."
                : formatarMoeda(
                    receitaMensal.reduce(
                      (total, item) =>
                        total + item.valor_centavos,
                      0
                    )
                  )}
            </p>
          </div>
        </div>

        <div className="mt-8 h-[340px] w-full">
          {carregando ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

                <p className="mt-4 text-sm text-slate-500">
                  Carregando gráfico...
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={receitaMensal}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="rgba(255, 255, 255, 0.06)"
                  vertical={false}
                />

                <XAxis
                  dataKey="mes"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tick={{
                    fill: "#64748b",
                    fontSize: 12,
                  }}
                  tickFormatter={(valor: number) =>
                    formatarMoedaReaisCurta(valor)
                  }
                />

                <Tooltip
                  cursor={{
                    fill: "rgba(255, 255, 255, 0.03)",
                  }}
                  content={<TooltipReceita />}
                />

                <Bar
                  dataKey="valor_reais"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={54}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-white">
          Como os valores são calculados
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
          A receita considera somente pagamentos reais com
          status aprovado e processamento concluído. Contas
          Premium ativadas manualmente aparecem na quantidade
          de usuários Premium, mas não são contabilizadas como
          receita ou assinatura convertida.
        </p>
      </section>
    </div>
  );
}

function TituloSecao({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-white">
        {titulo}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {descricao}
      </p>
    </div>
  );
}

type Destaque =
  | "emerald"
  | "blue"
  | "violet"
  | "amber";

function CardFinanceiro({
  titulo,
  valor,
  descricao,
  destaque,
}: {
  titulo: string;
  valor: string;
  descricao: string;
  destaque: Destaque;
}) {
  const estilos: Record<
    Destaque,
    {
      borda: string;
      fundo: string;
      texto: string;
    }
  > = {
    emerald: {
      borda: "border-emerald-500/20",
      fundo: "bg-emerald-500/[0.06]",
      texto: "text-emerald-300",
    },
    blue: {
      borda: "border-blue-500/20",
      fundo: "bg-blue-500/[0.06]",
      texto: "text-blue-300",
    },
    violet: {
      borda: "border-violet-500/20",
      fundo: "bg-violet-500/[0.06]",
      texto: "text-violet-300",
    },
    amber: {
      borda: "border-amber-500/20",
      fundo: "bg-amber-500/[0.06]",
      texto: "text-amber-300",
    },
  };

  const estilo = estilos[destaque];

  return (
    <article
      className={`rounded-2xl border p-6 ${estilo.borda} ${estilo.fundo}`}
    >
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <p
        className={`mt-4 break-words text-3xl font-semibold ${estilo.texto}`}
      >
        {valor}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}

function CardNumero({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <p className="mt-4 break-words text-3xl font-semibold text-white">
        {valor}
      </p>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}

function TooltipReceita({
  active,
  payload,
  label,
}: TooltipReceitaProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const valorReais = Number(
    payload[0]?.value ?? 0
  );

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b0f17] px-4 py-3 shadow-2xl">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {formatarMoedaEmReais(valorReais)}
      </p>
    </div>
  );
}

function formatarMoeda(
  valorCentavos: number
) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorCentavos / 100);
}

function formatarMoedaEmReais(
  valorReais: number
) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorReais);
}

function formatarMoedaReaisCurta(
  valorReais: number
) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation:
      Math.abs(valorReais) >= 1000
        ? "compact"
        : "standard",
    maximumFractionDigits: 1,
  }).format(valorReais);
}

function formatarPercentual(
  valor: number
) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor) + "%";
}