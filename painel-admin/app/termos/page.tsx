import Link from "next/link";

import BreadcrumbSchema from "@/components/breadcrumb-schema";

const secoes = [
  {
    titulo: "1. Aceitação dos Termos",
    conteudo: [
      "Ao acessar, cadastrar-se ou utilizar o Padrões B3, o usuário declara que leu, compreendeu e concorda com estes Termos de Uso e com a Política de Privacidade da plataforma.",
      "Caso não concorde com alguma condição, o usuário não deverá utilizar os serviços oferecidos.",
    ],
  },
  {
    titulo: "2. Sobre o Padrões B3",
    conteudo: [
      "O Padrões B3 é uma plataforma tecnológica de apoio à análise de ações brasileiras, baseada em dados históricos, backtests, padrões estatísticos e monitoramento automatizado do mercado.",
      "A plataforma pode apresentar informações como ativo analisado, estratégia identificada, horários de entrada e saída, taxa de acerto histórica, retorno médio, número de ocorrências, acertos, falhas e score estatístico.",
      "O Padrões B3 não atua como corretora, distribuidora, banco, gestora de recursos ou consultoria individual de investimentos.",
    ],
  },
  {
    titulo: "3. Ausência de recomendação de investimento",
    conteudo: [
      "As informações disponibilizadas possuem caráter exclusivamente informativo e educacional.",
      "Nenhuma informação apresentada deve ser interpretada como recomendação individual de compra, venda ou manutenção de valores mobiliários.",
      "O usuário é o único responsável por avaliar seu perfil de risco, seus objetivos financeiros e a adequação de qualquer decisão de investimento.",
      "Sempre que necessário, o usuário deverá buscar orientação de um profissional devidamente habilitado.",
    ],
  },
  {
    titulo: "4. Riscos e resultados históricos",
    conteudo: [
      "Investimentos em ações envolvem riscos e podem resultar em perdas parciais ou totais do capital investido.",
      "Taxas de acerto, retornos médios, scores, backtests e demais estatísticas representam comportamentos observados em dados históricos.",
      "Resultados passados não garantem, não indicam necessariamente e não asseguram resultados futuros.",
      "Mudanças nas condições do mercado, liquidez, volatilidade, custos operacionais, impostos, atrasos e diferenças de execução podem alterar o resultado real de uma operação.",
    ],
  },
  {
    titulo: "5. Cadastro e segurança da conta",
    conteudo: [
      "Para acessar determinadas funcionalidades, o usuário deverá criar uma conta e fornecer informações verdadeiras, completas e atualizadas.",
      "O usuário é responsável por manter sua senha em segurança e por todas as atividades realizadas por meio de sua conta.",
      "É proibido compartilhar credenciais, utilizar contas de terceiros ou tentar acessar áreas restritas sem autorização.",
      "Ao identificar uso não autorizado, o usuário deverá alterar sua senha e entrar em contato com a plataforma.",
    ],
  },
  {
    titulo: "6. Idade e capacidade legal",
    conteudo: [
      "A contratação de planos pagos deve ser realizada por pessoa legalmente capaz de contratar ou por seu responsável legal.",
      "O uso da plataforma por menores de idade deve ocorrer com conhecimento e acompanhamento de seus pais ou responsáveis.",
      "O Padrões B3 não incentiva menores a realizar operações financeiras sem supervisão responsável.",
    ],
  },
  {
    titulo: "7. Planos e funcionalidades",
    conteudo: [
      "A plataforma poderá oferecer planos gratuitos e pagos, cada um com funcionalidades, limites e períodos de acesso próprios.",
      "O plano gratuito poderá limitar a quantidade de oportunidades disponíveis.",
      "Os planos Premium poderão oferecer acesso completo às oportunidades, estatísticas adicionais e notificações por e-mail.",
      "As funcionalidades de cada plano serão apresentadas antes da contratação e poderão evoluir ao longo do tempo, sem redução indevida de direitos já adquiridos.",
    ],
  },
  {
    titulo: "8. Pagamentos e ativação",
    conteudo: [
      "Os pagamentos dos planos poderão ser processados por empresas terceiras especializadas, como o Mercado Pago.",
      "A assinatura será ativada após a confirmação do pagamento pelo processador responsável.",
      "O Padrões B3 não armazena diretamente dados completos de cartões ou credenciais bancárias inseridas no ambiente do processador de pagamento.",
      "Eventuais prazos de aprovação, recusas ou verificações adicionais podem depender da instituição financeira e do meio de pagamento escolhido.",
    ],
  },
  {
    titulo: "9. Renovação e validade da assinatura",
    conteudo: [
      "O período de acesso será informado no momento da contratação.",
      "Planos mensais e anuais terão validade correspondente ao período adquirido e confirmado no sistema.",
      "Quando não houver renovação automática configurada, o usuário deverá realizar uma nova contratação para continuar utilizando os recursos Premium após o vencimento.",
      "A data de validade poderá ser consultada na área da conta.",
    ],
  },
  {
    titulo: "10. Cancelamento e direitos do consumidor",
    conteudo: [
      "O usuário poderá solicitar o cancelamento pelos canais disponibilizados pela plataforma.",
      "O cancelamento impede cobranças futuras quando houver renovação recorrente, mas não elimina obrigações já constituídas.",
      "Pedidos de cancelamento, reembolso ou arrependimento serão analisados conforme a forma de pagamento, o período contratado e os direitos previstos na legislação brasileira aplicável.",
      "Nada nestes Termos limita direitos assegurados ao consumidor por normas obrigatórias.",
    ],
  },
  {
    titulo: "11. Disponibilidade do serviço",
    conteudo: [
      "A plataforma busca manter seus sistemas disponíveis e atualizados, mas não garante funcionamento ininterrupto ou livre de falhas.",
      "Podem ocorrer interrupções por manutenção, indisponibilidade de provedores, falhas de internet, problemas no mercado de dados, incidentes de segurança ou eventos fora do controle da plataforma.",
      "O scanner, os e-mails e outras rotinas automáticas podem sofrer atrasos ou indisponibilidade temporária.",
    ],
  },
  {
    titulo: "12. Dados e informações de mercado",
    conteudo: [
      "Os dados utilizados pela plataforma podem ser obtidos de fontes públicas ou fornecedores externos.",
      "Diferenças de horário, ajustes, atrasos, indisponibilidades e correções nas fontes podem afetar temporariamente as análises.",
      "O usuário deve conferir preços, horários e condições diretamente em sua corretora antes de realizar qualquer operação.",
    ],
  },
  {
    titulo: "13. Uso permitido",
    conteudo: [
      "O usuário poderá utilizar a plataforma para fins pessoais e legítimos, respeitando estes Termos e a legislação aplicável.",
      "É proibido tentar copiar bancos de dados, explorar vulnerabilidades, realizar engenharia reversa indevida, automatizar acessos abusivos ou prejudicar o funcionamento do sistema.",
      "Também é proibido revender, reproduzir ou distribuir conteúdo restrito da plataforma sem autorização.",
    ],
  },
  {
    titulo: "14. Propriedade intelectual",
    conteudo: [
      "A marca Padrões B3, o software, o design, os textos, os relatórios, as estruturas de análise e os demais elementos da plataforma são protegidos pela legislação aplicável.",
      "A contratação de um plano concede apenas uma licença pessoal, limitada, revogável e não transferível para utilização do serviço.",
      "Nenhuma disposição destes Termos transfere ao usuário direitos de propriedade sobre a plataforma.",
    ],
  },
  {
    titulo: "15. Comunicações por e-mail",
    conteudo: [
      "O usuário poderá receber mensagens necessárias ao funcionamento da conta, incluindo recuperação de senha, confirmação de pagamento, avisos de segurança e informações da assinatura.",
      "Assinantes Premium também poderão receber alertas relacionados às oportunidades identificadas pelo sistema.",
      "A entrega de mensagens depende de serviços externos e pode ser afetada por filtros de spam, configurações do provedor ou endereço incorreto.",
    ],
  },
  {
    titulo: "16. Limitação de responsabilidade",
    conteudo: [
      "Dentro dos limites permitidos pela legislação, o Padrões B3 não será responsável por decisões de investimento tomadas pelo usuário, perdas financeiras, lucros cessantes ou resultados diferentes dos dados históricos apresentados.",
      "A plataforma também não se responsabiliza por falhas de corretoras, bolsas, instituições financeiras, provedores de dados, processadores de pagamento ou serviços de e-mail.",
      "Esta cláusula não exclui responsabilidades que não possam ser afastadas pela legislação aplicável.",
    ],
  },
  {
    titulo: "17. Suspensão e encerramento de contas",
    conteudo: [
      "A plataforma poderá suspender ou encerrar contas utilizadas de forma fraudulenta, abusiva, ilegal ou contrária a estes Termos.",
      "Quando possível e adequado, o usuário será informado sobre a medida e poderá solicitar esclarecimentos pelos canais de contato.",
    ],
  },
  {
    titulo: "18. Privacidade e proteção de dados",
    conteudo: [
      "O tratamento de dados pessoais é descrito na Política de Privacidade do Padrões B3.",
      "Ao utilizar a plataforma, o usuário reconhece que determinados dados são necessários para cadastro, autenticação, pagamento, segurança e prestação do serviço.",
    ],
  },
  {
    titulo: "19. Alterações destes Termos",
    conteudo: [
      "Estes Termos poderão ser atualizados para refletir mudanças legais, operacionais ou nas funcionalidades da plataforma.",
      "Quando a alteração for relevante, a plataforma poderá comunicar os usuários por aviso no sistema ou por e-mail.",
      "A versão mais recente permanecerá disponível nesta página, com a data de atualização.",
    ],
  },
  {
    titulo: "20. Legislação aplicável",
    conteudo: [
      "Estes Termos são regidos pela legislação da República Federativa do Brasil.",
      "Eventuais conflitos serão tratados pelos canais de atendimento e, quando necessário, pelos órgãos ou autoridades competentes, respeitados os direitos legais do consumidor.",
    ],
  },
  {
    titulo: "21. Contato",
    conteudo: [
      "Dúvidas, solicitações ou comunicações relacionadas a estes Termos poderão ser encaminhadas pelo canal indicado na página de contato da plataforma.",
    ],
  },
];

export default function TermosPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <BreadcrumbSchema
        itens={[
          {
            nome: "Início",
            caminho: "/",
          },
          {
            nome: "Termos de Uso",
            caminho: "/termos",
          },
        ]}
      />

      <header className="border-b border-white/10 bg-[#07111f]">
        <div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Voltar para a página inicial"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">
              B3
            </span>

            <span className="min-w-0">
              <span className="block truncate font-semibold">
                Padrões B3
              </span>

              <span className="block truncate text-xs text-slate-500">
                Termos de Uso
              </span>
            </span>
          </Link>

          <Link
            href="/"
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white sm:px-4"
          >
            Voltar ao início
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
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

          <span aria-hidden="true">/</span>

          <span
            aria-current="page"
            className="text-slate-300"
          >
            Termos de Uso
          </span>
        </nav>

        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-blue-400">
            Informações legais
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Termos de Uso
          </h1>

          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Estes Termos estabelecem as condições para acesso
            e utilização da plataforma Padrões B3.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Última atualização: 16 de julho de 2026.
          </p>
        </div>

        <section className="mt-10 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 sm:p-6">
          <h2 className="font-medium text-amber-200">
            Aviso sobre investimentos
          </h2>

          <p className="mt-2 text-sm leading-7 text-amber-200/70">
            O Padrões B3 não garante lucro e não oferece
            recomendação individual de investimentos. Toda
            decisão financeira é de responsabilidade do usuário.
          </p>
        </section>

        <div className="mt-10 space-y-5">
          {secoes.map((secao) => (
            <section
              key={secao.titulo}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
            >
              <h2 className="text-lg font-semibold text-white sm:text-xl">
                {secao.titulo}
              </h2>

              <div className="mt-4 space-y-4">
                {secao.conteudo.map((paragrafo) => (
                  <p
                    key={paragrafo}
                    className="text-sm leading-7 text-slate-400 sm:text-base"
                  >
                    {paragrafo}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row">
          <Link
            href="/privacidade"
            className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Política de Privacidade
          </Link>

          <Link
            href="/contato"
            className="flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 text-center text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Entrar em contato
          </Link>

          <Link
            href="/"
            className="flex min-h-12 items-center justify-center rounded-xl border border-white/10 px-5 text-center text-sm font-medium text-slate-200 transition hover:bg-white/5"
          >
            Voltar ao início
          </Link>
        </div>

        <p className="mt-8 text-xs leading-6 text-slate-600">
          Este conteúdo é um modelo informativo para a
          plataforma e deve ser revisado por um profissional
          jurídico antes do lançamento comercial definitivo.
        </p>
      </article>
    </main>
  );
}