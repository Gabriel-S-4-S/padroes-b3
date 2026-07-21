"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const linksMenu = [
  {
    nome: "Como funciona",
    caminho: "#como-funciona",
  },
  {
    nome: "Benefícios",
    caminho: "#beneficios",
  },
  {
    nome: "Planos",
    caminho: "#planos",
  },
  {
    nome: "Perguntas frequentes",
    caminho: "#perguntas",
  },
];

export default function PublicHeader() {
  const caminhoAtual = usePathname();

  const [menuAberto, setMenuAberto] =
    useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [caminhoAtual]);

  useEffect(() => {
    if (!menuAberto) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAberto]);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#05070b]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link
          href="/"
          aria-label="Página inicial do Padrões B3"
          className="flex min-w-0 items-center gap-3"
          onClick={fecharMenu}
        >
          <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
            <Image
              src="/logo.png"
              alt="Padrões B3"
              fill
              className="object-contain"
              priority
            />
          </div>

          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white sm:text-base">
              Padrões B3
            </span>

            <span className="hidden text-xs text-slate-500 sm:block">
              Inteligência estatística
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-8 lg:flex"
        >
          {linksMenu.map((item) => (
            <a
              key={item.caminho}
              href={item.caminho}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {item.nome}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/cliente"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Fazer login
          </Link>

          <Link
            href="/cliente/cadastro"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Criar conta grátis
          </Link>
        </div>

        <button
          type="button"
          aria-label={
            menuAberto
              ? "Fechar menu"
              : "Abrir menu"
          }
          aria-expanded={menuAberto}
          aria-controls="menu-publico-mobile"
          onClick={() =>
            setMenuAberto((aberto) => !aberto)
          }
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.07] sm:hidden"
        >
          <span className="sr-only">
            {menuAberto
              ? "Fechar menu"
              : "Abrir menu"}
          </span>

          <span className="relative h-5 w-5">
            <span
              className={`absolute left-0 top-1 h-0.5 w-5 rounded-full bg-current transition ${
                menuAberto
                  ? "translate-y-1.5 rotate-45"
                  : ""
              }`}
            />

            <span
              className={`absolute left-0 top-2.5 h-0.5 w-5 rounded-full bg-current transition ${
                menuAberto
                  ? "opacity-0"
                  : "opacity-100"
              }`}
            />

            <span
              className={`absolute left-0 top-4 h-0.5 w-5 rounded-full bg-current transition ${
                menuAberto
                  ? "-translate-y-1.5 -rotate-45"
                  : ""
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="menu-publico-mobile"
        className={`fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] border-t border-white/10 bg-[#05070b] transition duration-200 sm:hidden ${
          menuAberto
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 pb-8 pt-5">
          <nav
            aria-label="Navegação móvel"
            className="space-y-2"
          >
            {linksMenu.map((item) => (
              <a
                key={item.caminho}
                href={item.caminho}
                onClick={fecharMenu}
                className="block rounded-xl border border-transparent px-4 py-4 text-base font-medium text-slate-200 transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                {item.nome}
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-3 border-t border-white/10 pt-6">
            <Link
              href="/cliente"
              onClick={fecharMenu}
              className="flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm font-medium text-slate-200 transition hover:bg-white/[0.07]"
            >
              Fazer login
            </Link>

            <Link
              href="/cliente/cadastro"
              onClick={fecharMenu}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>

      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={fecharMenu}
          className="fixed inset-0 top-16 z-30 bg-black/40 sm:hidden"
        />
      )}
    </header>
  );
}
