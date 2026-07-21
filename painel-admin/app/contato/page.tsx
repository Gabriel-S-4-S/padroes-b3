"use client";

import Link from "next/link";
import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import BreadcrumbSchema from "@/components/breadcrumb-schema";

const EMAIL_CONTATO =
  process.env.NEXT_PUBLIC_EMAIL_CONTATO ??
  "contato@padroesb3.com.br";

const assuntos = [
  "Dúvida sobre a plataforma",
  "Assinatura e pagamento",
  "Problema de acesso",
  "Recuperação de conta",
  "Privacidade e dados pessoais",
  "Cancelamento",
  "Sugestão ou feedback",
  "Outro assunto",
];

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  const [assunto, setAssunto] = useState(
    assuntos[0]
  );

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] = useState("");

  const caracteresRestantes = useMemo(
    () => 2000 - mensagem.length,
    [mensagem]
  );

 function enviarMensagem(
  evento: FormEvent<HTMLFormElement>
) {
  evento.preventDefault();

  setErro("");

  if (nome.trim().length < 3) {
    setErro(
      "Informe um nome com pelo menos 3 caracteres."
    );
    return;
  }

  if (!email.trim()) {
    setErro(
      "Informe seu endereço de e-mail."
    );
    return;
  }

  if (mensagem.trim().length < 10) {
    setErro(
      "Explique sua solicitação com pelo menos 10 caracteres."
    );
    return;
  }

  const tituloEmail =
    `[Padrões B3] ${assunto}`;

  const corpoEmail = [
    `Nome: ${nome.trim()}`,
    `E-mail: ${email
      .trim()
      .toLowerCase()}`,
    `Assunto: ${assunto}`,
    "",
    "Mensagem:",
    mensagem.trim(),
  ].join("\n");

  const linkGmail =
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent(
      EMAIL_CONTATO
    )}` +
    `&su=${encodeURIComponent(
      tituloEmail
    )}` +
    `&body=${encodeURIComponent(
      corpoEmail
    )}`;

  window.open(linkGmail, "_blank");
}
  return (
      <header className="border-b border-white/10 bg-[#07111f]">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
              B3
            </span>

            <span className="min-w-0">
              <span className="block truncate font-semibold">
                Padrões B3
              </span>

              <span className="block text-xs text-slate-500">
                Central de contato
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Navegação estrutural"
            className="mb-8 flex flex-wrap items-center gap-2 text-sm text-slate-500"
          >
            <Link
              href="/"
              className="transition hover:text-white"
            >
              Início
            </Link>

            <span aria-hidden="true">
              /
            </span>

            <span
              aria-current="page"
              className="text-slate-300"
            >
              Contato
            </span>
          </nav>

          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-400">
              Atendimento
            </p>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Como podemos ajudar?
            </h1>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              Entre em contato para esclarecer dúvidas
              sobre acesso, assinatura, pagamento,
              privacidade ou funcionamento do Padrões B3.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="space-y-5">
              <InformacaoContato
                titulo="Atendimento por e-mail"
                descricao="Envie sua solicitação com o máximo de detalhes possível."
                valor={EMAIL_CONTATO}
              />

              <InformacaoContato
                titulo="Prazo de resposta"
                descricao="As mensagens serão analisadas em ordem de recebimento."
                valor="Até 2 dias úteis"
              />

              <InformacaoContato
                titulo="Problemas de pagamento"
                descricao="Informe o e-mail da conta, o plano escolhido e a data aproximada."
                valor="Não envie dados bancários"
              />

              <InformacaoContato
                titulo="Privacidade"
                descricao="Você pode solicitar acesso, correção ou análise dos seus dados pessoais."
                valor="Solicitação do titular"
              />

              <section className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 sm:p-6">
                <h2 className="font-medium text-amber-200">
                  Proteja seus dados
                </h2>

                <p className="mt-2 text-sm leading-7 text-amber-200/70">
                  Nunca envie sua senha, token de
                  recuperação, número completo de cartão,
                  código de segurança ou credenciais
                  bancárias.
                </p>
              </section>
            </aside>

            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20 sm:p-7 lg:p-8">
              <div>
                <p className="text-sm font-medium text-blue-400">
                  Enviar solicitação
                </p>

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Fale com o Padrões B3
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Preencha os campos abaixo. Ao continuar,
                  seu aplicativo de e-mail será aberto com
                  a mensagem preparada.
                </p>
              </div>

              {erro && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
                >
                  {erro}
                </div>
              )}

              <form
                onSubmit={enviarMensagem}
                className="mt-7 space-y-5"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Campo
                    id="nome"
                    label="Nome"
                    value={nome}
                    onChange={setNome}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                  />

                  <Campo
                    id="email"
                    label="E-mail"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="seuemail@exemplo.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>

                <div>
                  <label
                    htmlFor="assunto"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Assunto
                  </label>

                  <select
                    id="assunto"
                    value={assunto}
                    onChange={(evento) =>
                      setAssunto(
                        evento.target.value
                      )
                    }
                    required
                    className="min-h-12 w-full rounded-xl border border-white/10 bg-[#080c13] px-4 text-base text-white outline-none transition focus:border-blue-500"
                  >
                    {assuntos.map((opcao) => (
                      <option
                        key={opcao}
                        value={opcao}
                      >
                        {opcao}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="mensagem"
                      className="text-sm text-slate-300"
                    >
                      Mensagem
                    </label>

                    <span
                      className={`text-xs ${
                        caracteresRestantes < 100
                          ? "text-amber-300"
                          : "text-slate-600"
                      }`}
                    >
                      {caracteresRestantes} restantes
                    </span>
                  </div>

                  <textarea
                    id="mensagem"
                    value={mensagem}
                    onChange={(evento) =>
                      setMensagem(
                        evento.target.value
                      )
                    }
                    placeholder="Explique sua dúvida ou solicitação."
                    maxLength={2000}
                    rows={7}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-base leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs leading-6 text-slate-500">
                    Ao enviar, você autoriza o uso dos
                    dados informados para responder à sua
                    solicitação, conforme nossa Política
                    de Privacidade.
                  </p>
                </div>

                <button
                  type="submit"
                  className="flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center text-sm font-medium text-white transition hover:bg-blue-500 sm:w-auto"
                >
                  Preparar e-mail
                </button>
              </form>
            </section>
          </div>

          <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white">
              Antes de entrar em contato
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Orientacao
                numero="01"
                titulo="Informe sua conta"
                descricao="Use o mesmo e-mail cadastrado na plataforma quando a solicitação estiver relacionada ao seu acesso."
              />

              <Orientacao
                numero="02"
                titulo="Explique o problema"
                descricao="Informe o que aconteceu, em qual página e qual mensagem apareceu na tela."
              />

              <Orientacao
                numero="03"
                titulo="Evite dados sensíveis"
                descricao="Não envie senhas, tokens, documentos completos ou dados bancários."
              />
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row">
            <Link
              href="/termos"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Termos de Uso
            </Link>

            <Link
              href="/privacidade"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Política de Privacidade
            </Link>

            <Link
              href="/cliente"
              className="flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 text-center text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Acessar minha conta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Campo({
  id,
  label,
  type = "text",
  inputMode,
  value,
  onChange,
  placeholder,
  autoComplete,
  autoCapitalize,
  spellCheck,
}: {
  id: string;
  label: string;
  type?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
}) {
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
        inputMode={inputMode}
        value={value}
        onChange={(evento) =>
          onChange(evento.target.value)
        }
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        spellCheck={spellCheck}
        required
        className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
      />
    </div>
  );
}

function InformacaoContato({
  titulo,
  descricao,
  valor,
}: {
  titulo: string;
  descricao: string;
  valor: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h2 className="font-medium text-white">
        {titulo}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {descricao}
      </p>

      <p className="mt-4 break-words text-sm font-medium text-blue-300">
        {valor}
      </p>
    </article>
  );
}

function Orientacao({
  numero,
  titulo,
  descricao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <article className="rounded-xl border border-white/5 bg-black/20 p-4">
      <p className="text-sm font-semibold text-blue-400">
        {numero}
      </p>

      <h3 className="mt-3 font-medium text-slate-200">
        {titulo}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}
