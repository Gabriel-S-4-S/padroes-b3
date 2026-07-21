"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/stat-card";
import { apiFetch } from "@/app/services/api";


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


type RegistroAuditoria = {
  id: number;
  tipo: string;
  acao: string;
  usuario_email: string | null;
  responsavel: string | null;
  detalhes: string | null;
  data_criacao: string;
};


type RespostaAuditoria = {
  quantidade: number;
  registros: RegistroAuditoria[];
};


export default function DashboardPage() {
  const [resumo, setResumo] = useState<ResumoAdmin | null>(null);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);


  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [dadosResumo, dadosAuditoria] = await Promise.all([
          apiFetch<ResumoAdmin>("/admin/resumo"),
          apiFetch<RespostaAuditoria>("/admin/auditoria?limite=5"),
        ]);

        setResumo(dadosResumo);
        setAuditoria(dadosAuditoria.registros);
      } catch (erroDesconhecido) {
        const mensagem =
          erroDesconhecido instanceof Error
            ? erroDesconhecido.message
            : "Não foi possível carregar o dashboard.";

        setErro(mensagem);
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);


  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="text-sm font-medium text-blue-400">
          Visão geral
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Acompanhe os principais dados do Padrões B3.
        </p>
      </div>

      {erro && (
        <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Usuários cadastrados"
          valor={
            carregando
              ? "..."
              : resumo?.usuarios_cadastrados ?? 0
          }
          descricao="Contas registradas na plataforma"
        />

        <StatCard
          titulo="Assinaturas ativas"
          valor={
            carregando
              ? "..."
              : resumo?.assinaturas_ativas ?? 0
          }
          descricao="Planos mensal e anual válidos"
        />

        <StatCard
          titulo="Oportunidades agora"
          valor={
            carregando
              ? "..."
              : resumo?.oportunidades_ativas ?? 0
          }
          descricao="Oportunidades identificadas pelo scanner"
        />

        <StatCard
          titulo="Estratégias aprovadas"
          valor={
            carregando
              ? "..."
              : resumo?.estrategias_aprovadas ?? 0
          }
          descricao="Padrões aprovados pelo laboratório"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">
          <div>
            <h2 className="font-semibold text-white">
              Atividade recente
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Últimas movimentações administrativas
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {carregando && (
              <p className="text-sm text-slate-500">
                Carregando atividades...
              </p>
            )}

            {!carregando && auditoria.length === 0 && (
              <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                <p className="text-sm text-slate-400">
                  Nenhuma atividade registrada.
                </p>
              </div>
            )}

            {auditoria.map((registro) => (
              <div
                key={registro.id}
                className="rounded-xl border border-white/5 bg-black/20 p-4"
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {formatarAcao(registro.acao)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {registro.detalhes ??
                        "Nenhum detalhe informado."}
                    </p>

                    {registro.usuario_email && (
                      <p className="mt-2 text-xs text-blue-400">
                        {registro.usuario_email}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs text-slate-500">
                      {formatarData(registro.data_criacao)}
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                      {registro.responsavel ?? "sistema"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-semibold text-white">
            Dados do sistema
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Informações atuais do backend
          </p>

          <div className="mt-6 space-y-5">
            <LinhaSistema
              nome="Ações analisadas"
              valor={resumo?.acoes ?? 0}
              carregando={carregando}
            />

            <LinhaSistema
              nome="Candles armazenados"
              valor={formatarNumero(resumo?.candles ?? 0)}
              carregando={carregando}
            />

            <LinhaSistema
              nome="Usuários gratuitos"
              valor={resumo?.usuarios_gratuitos ?? 0}
              carregando={carregando}
            />

            <LinhaSistema
              nome="API"
              valor={erro ? "Indisponível" : "Online"}
              carregando={false}
              online={!erro}
            />
          </div>
        </article>
      </div>
    </div>
  );
}


type LinhaSistemaProps = {
  nome: string;
  valor: string | number;
  carregando: boolean;
  online?: boolean;
};


function LinhaSistema({
  nome,
  valor,
  carregando,
  online = false,
}: LinhaSistemaProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      
      <span className="text-sm text-slate-400">
        {nome}
      </span>
      
      <div className="flex items-center gap-2">
        {online && (
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
        )}

        <span className="text-sm text-slate-200">
          {carregando ? "..." : valor}
        </span>
      </div>
    </div>
  );
}


function formatarAcao(acao: string) {
  const nomes: Record<string, string> = {
    ativar_assinatura: "Assinatura ativada",
    cancelar_assinatura: "Assinatura cancelada",
    renovar_assinatura: "Assinatura renovada",
    criar_usuario: "Usuário criado",
    alterar_senha: "Senha alterada",
  };

  return (
    nomes[acao] ??
    acao
      .replaceAll("_", " ")
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}


function formatarData(dataTexto: string) {
  const data = new Date(dataTexto.replace(" ", "T"));

  if (Number.isNaN(data.getTime())) {
    return dataTexto;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}


function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}
