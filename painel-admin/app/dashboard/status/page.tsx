"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/app/services/api";

type StatusPublico = {
  acoes: number;
  candles: number;
  linhas_carregadas: number;
};

type ResumoAdmin = {
  usuarios_cadastrados: number;
  assinaturas_ativas: number;
  usuarios_gratuitos: number;
  acoes: number;
  candles: number;
  linhas_carregadas: number;
  estrategias_aprovadas: number;
  oportunidades_ativas: number;
};

type SituacaoApi = "verificando" | "online" | "offline";

export default function StatusPage() {
  const [status, setStatus] = useState<StatusPublico | null>(null);
  const [resumo, setResumo] = useState<ResumoAdmin | null>(null);

  const [situacaoApi, setSituacaoApi] =
    useState<SituacaoApi>("verificando");

  const [tempoResposta, setTempoResposta] = useState<number | null>(
    null
  );

  const [ultimaVerificacao, setUltimaVerificacao] =
    useState<Date | null>(null);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const verificarSistema = useCallback(async () => {
    setCarregando(true);
    setSituacaoApi("verificando");
    setErro("");

    const inicio = performance.now();

    try {
      const [dadosStatus, dadosResumo] = await Promise.all([
        apiFetch<StatusPublico>("/status", {
          usarToken: false,
        }),
        apiFetch<ResumoAdmin>("/admin/resumo"),
      ]);

      const fim = performance.now();

      setStatus(dadosStatus);
      setResumo(dadosResumo);
      setTempoResposta(Math.round(fim - inicio));
      setSituacaoApi("online");
    } catch (erroDesconhecido) {
      const fim = performance.now();

      setTempoResposta(Math.round(fim - inicio));
      setSituacaoApi("offline");

      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível consultar o sistema."
      );
    } finally {
      setUltimaVerificacao(new Date());
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    verificarSistema();
  }, [verificarSistema]);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-sm font-medium text-blue-400">
            Monitoramento
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-white">
            Status da API
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Verifique a comunicação entre o painel e o backend.
          </p>
        </div>

        <button
          type="button"
          onClick={verificarSistema}
          disabled={carregando}
          className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? "Verificando..." : "Verificar novamente"}
        </button>
      </div>

      {erro && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          titulo="API FastAPI"
          situacao={situacaoApi}
          descricao={
            situacaoApi === "online"
              ? "Backend respondendo normalmente"
              : situacaoApi === "offline"
                ? "Não foi possível acessar o backend"
                : "Consultando o backend"
          }
        />

        <InfoCard
          titulo="Tempo de resposta"
          valor={
            tempoResposta === null
              ? "..."
              : `${tempoResposta} ms`
          }
          descricao="Tempo total das consultas"
        />

        <InfoCard
          titulo="Ações monitoradas"
          valor={carregando ? "..." : status?.acoes ?? 0}
          descricao="Ativos disponíveis no banco"
        />

        <InfoCard
          titulo="Candles armazenados"
          valor={
            carregando
              ? "..."
              : formatarNumero(status?.candles ?? 0)
          }
          descricao="Registros históricos de preço"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">
          <div>
            <h2 className="font-semibold text-white">
              Informações do backend
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Dados retornados pelas rotas da API
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <LinhaInformacao
              titulo="Linhas carregadas"
              valor={formatarNumero(
                status?.linhas_carregadas ?? 0
              )}
              carregando={carregando}
            />

            <LinhaInformacao
              titulo="Estratégias aprovadas"
              valor={resumo?.estrategias_aprovadas ?? 0}
              carregando={carregando}
            />

            <LinhaInformacao
              titulo="Oportunidades ativas"
              valor={resumo?.oportunidades_ativas ?? 0}
              carregando={carregando}
            />

            <LinhaInformacao
              titulo="Usuários cadastrados"
              valor={resumo?.usuarios_cadastrados ?? 0}
              carregando={carregando}
            />

            <LinhaInformacao
              titulo="Assinaturas ativas"
              valor={resumo?.assinaturas_ativas ?? 0}
              carregando={carregando}
            />

            <LinhaInformacao
              titulo="Usuários gratuitos"
              valor={resumo?.usuarios_gratuitos ?? 0}
              carregando={carregando}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-semibold text-white">
            Verificação atual
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informações desta consulta
          </p>

          <div className="mt-6 space-y-5">
            <LinhaStatus
              titulo="API"
              valor={
                situacaoApi === "online"
                  ? "Online"
                  : situacaoApi === "offline"
                    ? "Indisponível"
                    : "Verificando"
              }
              online={situacaoApi === "online"}
            />

            <LinhaStatus
              titulo="Autenticação"
              valor={resumo ? "Válida" : "Não confirmada"}
              online={Boolean(resumo)}
            />

            <LinhaStatus
              titulo="Banco de dados"
              valor={status ? "Respondendo" : "Não confirmado"}
              online={Boolean(status)}
            />

            <div className="border-t border-white/10 pt-5">
              <p className="text-xs uppercase tracking-wider text-slate-600">
                Última verificação
              </p>

              <p className="mt-2 text-sm text-slate-300">
                {ultimaVerificacao
                  ? formatarData(ultimaVerificacao)
                  : "Ainda não realizada"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="font-semibold text-white">
          Endereços locais
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Serviços usados durante o desenvolvimento
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <EnderecoCard
            titulo="Painel administrativo"
            endereco="http://localhost:3000"
          />

          <EnderecoCard
            titulo="API FastAPI"
            endereco="http://127.0.0.1:8000"
          />

          <EnderecoCard
            titulo="Documentação Swagger"
            endereco="http://127.0.0.1:8000/docs"
          />
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  titulo,
  situacao,
  descricao,
}: {
  titulo: string;
  situacao: SituacaoApi;
  descricao: string;
}) {
  const configuracao = {
    verificando: {
      texto: "Verificando",
      ponto: "bg-amber-400",
      textoCor: "text-amber-300",
    },
    online: {
      texto: "Online",
      ponto: "bg-emerald-400",
      textoCor: "text-emerald-300",
    },
    offline: {
      texto: "Offline",
      ponto: "bg-red-400",
      textoCor: "text-red-300",
    },
  }[situacao];

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{titulo}</p>

      <div className="mt-4 flex items-center gap-3">
        <span
          className={`h-3 w-3 rounded-full ${configuracao.ponto}`}
        />

        <p
          className={`text-2xl font-semibold ${configuracao.textoCor}`}
        >
          {configuracao.texto}
        </p>
      </div>

      <p className="mt-3 text-xs text-slate-600">
        {descricao}
      </p>
    </article>
  );
}

function InfoCard({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: string | number;
  descricao: string;
}) {
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

function LinhaInformacao({
  titulo,
  valor,
  carregando,
}: {
  titulo: string;
  valor: string | number;
  carregando: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-2 text-lg font-medium text-slate-200">
        {carregando ? "..." : valor}
      </p>
    </div>
  );
}

function LinhaStatus({
  titulo,
  valor,
  online,
}: {
  titulo: string;
  valor: string;
  online: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-400">
        {titulo}
      </span>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            online ? "bg-emerald-400" : "bg-slate-600"
          }`}
        />

        <span className="text-sm text-slate-200">
          {valor}
        </span>
      </div>
    </div>
  );
}

function EnderecoCard({
  titulo,
  endereco,
}: {
  titulo: string;
  endereco: string;
}) {
  function abrirEndereco() {
    window.open(endereco, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={abrirEndereco}
      className="rounded-xl border border-white/5 bg-black/20 p-4 text-left transition hover:border-blue-500/30 hover:bg-blue-500/5"
    >
      <p className="text-xs uppercase tracking-wider text-slate-600">
        {titulo}
      </p>

      <p className="mt-2 break-all text-sm text-blue-400">
        {endereco}
      </p>
    </button>
  );
}

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function formatarData(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(data);
}