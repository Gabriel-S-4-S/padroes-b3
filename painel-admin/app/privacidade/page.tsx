import Link from "next/link";

import BreadcrumbSchema from "@/components/breadcrumb-schema";

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <BreadcrumbSchema
        itens={[
          {
            nome: "Início",
            caminho: "/",
          },
          {
            nome: "Política de Privacidade",
            caminho: "/privacidade",
          },
        ]}
      />

      <header className="border-b border-white/10 bg-[#07111f]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold">
              B3
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">
                Padrões B3
              </p>

              <p className="truncate text-xs text-slate-500">
                Política de Privacidade
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <section className="px-4 py-12 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-4xl">
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
              Política de Privacidade
            </span>
          </nav>

          <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-400">
            Última atualização
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Política de Privacidade
          </h1>

          <p className="mt-5 text-base leading-8 text-slate-400 sm:text-lg">
            A sua privacidade é importante para o Padrões B3.
            Esta política explica quais informações são
            coletadas, como elas são utilizadas e quais são
            os seus direitos.
          </p>

          <div className="mt-12 space-y-10">
            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                1. Informações coletadas
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Podemos coletar informações fornecidas durante
                o cadastro, como nome, endereço de e-mail,
                informações da assinatura e registros de acesso
                à plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                2. Finalidade dos dados
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Os dados são utilizados para autenticação,
                gerenciamento da conta, processamento das
                assinaturas, envio de oportunidades,
                comunicação com o usuário, suporte técnico e
                melhoria contínua da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                3. Compartilhamento
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                O Padrões B3 não comercializa dados pessoais.
                Informações poderão ser compartilhadas apenas
                quando necessário para processamento de
                pagamentos, cumprimento de obrigações legais ou
                funcionamento dos serviços contratados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                4. Segurança
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Adotamos medidas técnicas e administrativas para
                proteger as informações armazenadas contra acesso
                não autorizado, alteração, divulgação ou perda.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                5. Cookies
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Cookies podem ser utilizados para manter a
                sessão autenticada, melhorar a experiência de
                navegação e gerar estatísticas de utilização da
                plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                6. Direitos do usuário
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Você poderá solicitar acesso, correção,
                atualização ou exclusão de seus dados pessoais,
                observadas as obrigações legais de armazenamento
                aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                7. Alterações desta política
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Esta Política de Privacidade poderá ser alterada
                periodicamente para refletir melhorias na
                plataforma, mudanças legais ou novos recursos.
                A versão mais recente estará sempre disponível
                nesta página.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold sm:text-2xl">
                8. Contato
              </h2>

              <p className="mt-4 leading-8 text-slate-400">
                Caso tenha dúvidas sobre esta Política de
                Privacidade ou sobre o tratamento de seus dados,
                utilize nossa página de contato para falar com a
                equipe do Padrões B3.
              </p>

              <div className="mt-6">
                <Link
                  href="/contato"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center font-medium transition hover:bg-blue-500 sm:w-auto"
                >
                  Entrar em contato
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-16 border-t border-white/10 pt-8">
            <p className="text-sm leading-7 text-slate-500">
              Esta política está em conformidade com a Lei Geral
              de Proteção de Dados (LGPD – Lei nº 13.709/2018) e
              poderá ser atualizada sempre que necessário.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/termos"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Termos de Uso
            </Link>

            <Link
              href="/"
              className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm font-medium text-slate-200 transition hover:bg-white/5"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}