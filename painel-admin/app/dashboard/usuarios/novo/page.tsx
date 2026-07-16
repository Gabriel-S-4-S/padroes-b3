"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/app/services/api";

type Plano = "gratis" | "mensal" | "anual";
type Role = "usuario" | "admin";

type RespostaCriarUsuario = {
  sucesso: boolean;
  mensagem?: string;
  api_key?: string;
};

export default function NovoUsuarioPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [plano, setPlano] = useState<Plano>("gratis");
  const [role, setRole] = useState<Role>("usuario");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function criarUsuario(
    evento: FormEvent<HTMLFormElement>
  ) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setCarregando(true);
    setErro("");
    setMensagem("");

    try {
      const resposta = await apiFetch<RespostaCriarUsuario>(
        "/admin/usuarios/criar",
        {
          method: "POST",
          body: JSON.stringify({
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            senha,
            plano,
            role,
          }),
        }
      );

      if (!resposta.sucesso) {
        setErro(
          resposta.mensagem ??
            "Não foi possível criar o usuário."
        );
        return;
      }

      setMensagem("Usuário criado com sucesso.");

      setTimeout(() => {
        router.push("/dashboard/usuarios");
        router.refresh();
      }, 1000);
    } catch (erroDesconhecido) {
      setErro(
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível criar o usuário."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="p-6 lg:p-10">
      <div>
        <p className="text-sm font-medium text-blue-400">
          Administração
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-white">
          Novo usuário
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Crie uma nova conta manualmente.
        </p>
      </div>

      <section className="mt-8 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:p-8">
        {erro && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {mensagem && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {mensagem}
          </div>
        )}

        <form
          onSubmit={criarUsuario}
          className="space-y-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <CampoTexto
              id="nome"
              label="Nome"
              value={nome}
              onChange={setNome}
              placeholder="Nome completo"
              required
              disabled={carregando}
            />

            <CampoTexto
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="usuario@exemplo.com"
              required
              disabled={carregando}
            />
          </div>

          <CampoTexto
            id="senha"
            label="Senha temporária"
            type="password"
            value={senha}
            onChange={setSenha}
            placeholder="Mínimo de 8 caracteres"
            required
            disabled={carregando}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="plano"
                className="mb-2 block text-sm text-slate-300"
              >
                Plano inicial
              </label>

              <select
                id="plano"
                value={plano}
                onChange={(evento) =>
                  setPlano(evento.target.value as Plano)
                }
                disabled={carregando}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0e15] px-4 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60"
              >
                <option value="gratis">Grátis</option>
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="role"
                className="mb-2 block text-sm text-slate-300"
              >
                Permissão
              </label>

              <select
                id="role"
                value={role}
                onChange={(evento) =>
                  setRole(evento.target.value as Role)
                }
                disabled={carregando}
                className="h-12 w-full rounded-xl border border-white/10 bg-[#0a0e15] px-4 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60"
              >
                <option value="usuario">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-200">
              A senha será definida manualmente neste cadastro.
              Oriente o usuário a alterá-la após o primeiro acesso.
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/usuarios")
              }
              disabled={carregando}
              className="h-11 rounded-xl border border-white/10 px-5 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando}
              className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando
                ? "Criando usuário..."
                : "Criar usuário"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

type CampoTextoProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
};

function CampoTexto({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}: CampoTextoProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm text-slate-300"
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-60"
      />
    </div>
  );
}