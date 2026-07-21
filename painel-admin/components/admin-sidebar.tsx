"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const itensMenu = [
  {
    nome: "Dashboard",
    caminho: "/dashboard",
  },
  {
    nome: "Usuários",
    caminho: "/dashboard/usuarios",
  },
  {
    nome: "Assinaturas",
    caminho: "/dashboard/assinaturas",
  },
  {
    nome: "Financeiro",
    caminho: "/dashboard/financeiro",
  },
  {
    nome: "Oportunidades",
    caminho: "/dashboard/oportunidades",
  },
  {
    nome: "Estratégias",
    caminho: "/dashboard/estrategias",
  },
  {
    nome: "Scheduler",
    caminho: "/dashboard/scheduler",
  },
  {
    nome: "Auditoria",
    caminho: "/dashboard/auditoria",
  },
  {
    nome: "Status da API",
    caminho: "/dashboard/status",
  },
];

export default function AdminSidebar() {
  const caminhoAtual = usePathname();

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-[#07111f] p-6 lg:block">
      <div className="flex items-center gap-3">
        
       <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
        <Image
          src="/logo.png"
          alt="Padrões B3"
          fill
          className="object-contain"
          priority
        />
      </div>

        <div>
          <h1 className="font-semibold text-white">Padrões B3</h1>
          <p className="text-xs text-slate-500">Administração</p>
        </div>
      </div>

      <nav className="mt-10 space-y-2">
        {itensMenu.map((item) => {
          const estaAtivo =
            item.caminho === "/dashboard"
              ? caminhoAtual === "/dashboard"
              : caminhoAtual.startsWith(item.caminho);

          return (
            <Link
              key={item.caminho}
              href={item.caminho}
              className={`block rounded-xl px-4 py-3 text-sm transition ${
                estaAtivo
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.nome}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Sistema
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />

          <span className="text-sm text-slate-300">
            Painel conectado
          </span>
        </div>
      </div>
    </aside>
  );
}
