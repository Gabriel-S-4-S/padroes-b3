import Link from "next/link";
import Image from "next/image";
import PublicHeader from "@/components/public-header";

const beneficios = [
  {
    titulo: "Economize tempo de análise",
    descricao:
      "A plataforma monitora centenas de ações brasileiras para que você não precise acompanhar gráficos durante todo o pregão.",
  },
  {
    titulo: "Receba oportunidades por e-mail",
    descricao:
      "Assinantes Premium recebem alertas com ação, horário de compra, horário de saída e estatísticas históricas.",
  },
  {
    titulo: "Decisões apoiadas por dados",
    descricao:
      "Cada oportunidade apresenta taxa de acerto, retorno médio, ocorrências, acertos, falhas e score estatístico.",
  },
  {
    titulo: "Atualização durante o pregão",
    descricao:
      "O scanner atualiza os candles e procura novos padrões ao longo do dia, sem depender de análise manual.",
  },
  {
    titulo: "Mais de 300 ações monitoradas",
    descricao:
      "A ferramenta acompanha ações de diferentes setores da B3 e mantém a lista de ativos atualizada.",
  },
  {
    titulo: "Acesso simples e organizado",
    descricao:
      "Visualize oportunidades atuais, informações da conta, plano contratado e detalhes das análises em um único painel.",
  },
];


const etapas = [
  {
    numero: "01",
    titulo: "O laboratório analisa o histórico",
    descricao:
      "Milhares de combinações são testadas em dados históricos de ações negociadas na B3.",
  },
  {
    numero: "02",
    titulo: "Os melhores padrões são selecionados",
    descricao:
      "Somente estratégias que atendem aos critérios estatísticos da plataforma são aprovadas.",
  },
  {
    numero: "03",
    titulo: "O scanner acompanha o mercado",
    descricao:
      "Durante o dia, o sistema verifica se algum dos padrões aprovados está acontecendo novamente.",
  },
  {
    numero: "04",
    titulo: "Você recebe a oportunidade",
    descricao:
      "Quando um padrão é identificado, assinantes Premium recebem os dados da oportunidade por e-mail e no painel.",
  },
];


const perguntas = [
  {
    pergunta: "O que é o Padrões B3?",
    resposta:
      "O Padrões B3 é uma plataforma de análise estatística de ações brasileiras. O sistema testa padrões em dados históricos, acompanha o mercado durante o pregão e apresenta oportunidades com informações como taxa de acerto, retorno médio, horários e número de ocorrências.",
  },
  {
    pergunta: "O Padrões B3 garante lucro?",
    resposta:
      "Não. Nenhuma análise estatística, backtest ou estratégia de investimento pode garantir resultados futuros. A plataforma oferece informações históricas para apoiar sua análise e tomada de decisão.",
  },
  {
    pergunta: "Como as oportunidades são encontradas?",
    resposta:
      "O laboratório testa combinações de movimentos de preço, horários e médias em dados históricos. As estratégias que atendem aos critérios estatísticos são salvas e depois verificadas pelo scanner ao longo do pregão.",
  },
  {
    pergunta: "O que é um backtest de ações?",
    resposta:
      "Backtest é um teste realizado em dados históricos para observar como uma estratégia teria se comportado no passado. Ele ajuda a medir ocorrências, acertos, falhas, retorno médio e outros indicadores, mas não prevê o futuro com certeza.",
  },
  {
    pergunta: "Preciso entender muito sobre análise técnica?",
    resposta:
      "Não. As informações são apresentadas de forma objetiva, incluindo ação, estratégia, horário de compra, horário de saída, taxa de acerto, retorno médio e quantidade de ocorrências.",
  },
  {
    pergunta: "Quantas ações da B3 são analisadas?",
    resposta:
      "A plataforma monitora mais de 300 ações brasileiras. A lista pode ser atualizada para incluir novos ativos e remover ações que deixaram de ser negociadas.",
  },
  {
    pergunta: "Quando as oportunidades são atualizadas?",
    resposta:
      "O scanner atualiza os candles e procura oportunidades em diferentes horários durante o pregão da B3, após o fechamento dos candles acompanhados pelo sistema.",
  },
  {
    pergunta: "Como recebo as oportunidades?",
    resposta:
      "As oportunidades ficam disponíveis na área do cliente. Usuários dos planos Premium também recebem notificações por e-mail quando novos sinais elegíveis são identificados.",
  },
  {
    pergunta: "Posso usar o Padrões B3 pelo celular?",
    resposta:
      "Sim. A página pública, o login, o cadastro e a área do cliente foram desenvolvidos com layout responsivo para celulares, tablets e computadores.",
  },
  {
    pergunta: "Posso começar gratuitamente?",
    resposta:
      "Sim. O plano gratuito permite conhecer a plataforma e visualizar uma oportunidade quando houver um sinal disponível, sem necessidade de cartão no cadastro.",
  },
  {
    pergunta: "Qual é a diferença entre o plano mensal e o anual?",
    resposta:
      "Os dois oferecem acesso Premium completo. O plano mensal custa R$ 20 por mês, enquanto o anual custa R$ 180 por ano, equivalente a R$ 15 por mês.",
  },
  {
    pergunta: "Posso cancelar o plano mensal?",
    resposta:
      "Sim. O plano mensal não exige compromisso anual e pode ser cancelado. O acesso Premium permanece válido de acordo com o período já aprovado no pagamento.",
  },
  {
    pergunta: "A plataforma recomenda a compra de ações?",
    resposta:
      "Não. O Padrões B3 é uma ferramenta de apoio baseada em dados históricos. As informações não representam recomendação individual, consultoria financeira ou garantia de rentabilidade.",
  },
];




const dadosEstruturadosFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: perguntas.map((item) => ({
    "@type": "Question",
    name: item.pergunta,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.resposta,
    },
  })),
};

function escaparJsonLd(valor: unknown) {
  return JSON.stringify(valor).replace(
    /</g,
    "\\u003c"
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05070b] text-white">
      <script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: escaparJsonLd(
            dadosEstruturadosFaq
          ),
        }}
      />

      <PublicHeader />

      <section className="relative px-4 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-36 lg:pb-32 lg:pt-48">
        <div className="pointer-events-none absolute left-1/2 top-10 h-[420px] w-[90vw] max-w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[110px] sm:h-[500px] sm:blur-[130px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
          <div>
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-300 sm:px-4 sm:text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />

              <span>
                Scanner automático de ações da B3
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:mt-7 sm:text-6xl lg:text-7xl">
              Economize horas de análise e encontre oportunidades
              estatísticas em ações da B3.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:mt-7 sm:text-lg sm:leading-8">
              Feito para quem tem pouco tempo: o Padrões B3 monitora
              ações brasileiras, testa padrões históricos e organiza cada
              oportunidade com horário de compra, horário de saída, taxa de
              acerto, retorno médio e número de ocorrências.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:gap-4">
              <Link
                href="/cliente/cadastro"
                className="flex min-h-14 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center text-base font-medium text-white transition hover:bg-blue-500 sm:w-auto sm:px-7"
              >
                Começar gratuitamente
              </Link>

              <a
                href="#como-funciona"
                className="flex min-h-14 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 text-center text-base font-medium text-slate-200 transition hover:bg-white/[0.07] sm:w-auto sm:px-7"
              >
                Entender como funciona
              </a>
            </div>

            <div className="mt-7 grid gap-3 text-sm text-slate-500 sm:mt-8 sm:flex sm:flex-wrap sm:gap-x-7 sm:gap-y-3">
              <InformacaoRapida texto="Sem cartão no plano gratuito" />
              <InformacaoRapida texto="Dados históricos da B3" />
              <InformacaoRapida texto="Cancelamento a qualquer momento" />
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="absolute inset-0 rounded-[28px] bg-blue-600/10 blur-3xl sm:rounded-[32px]" />

            <div className="relative rounded-2xl border border-white/10 bg-[#0a1019]/90 p-4 shadow-2xl shadow-black/50 sm:rounded-[28px] sm:p-5">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blue-400 sm:text-xs sm:tracking-[0.2em]">
                    Oportunidade identificada
                  </p>

                  <p className="mt-2 text-xl font-semibold sm:text-2xl">
                    Exemplo de análise
                  </p>
                </div>

                <span className="w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Scanner ativo
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:mt-5 sm:p-6">
                <div className="flex flex-col gap-5 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Ação analisada
                    </p>

                    <p className="mt-2 text-3xl font-semibold sm:text-4xl">
                      VALE3
                    </p>
                  </div>

                  <div className="min-[380px]:text-right">
                    <p className="text-sm text-slate-500">
                      Score estatístico
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-blue-300">
                      92/100
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm text-slate-500">
                    Padrão histórico
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                    3 quedas consecutivas com preço abaixo da média
                    móvel
                  </p>
                </div>

                <div className="mt-6 grid gap-3 min-[380px]:grid-cols-2">
                  <DadoExemplo
                    titulo="Horário de compra"
                    valor="13:30"
                  />

                  <DadoExemplo
                    titulo="Horário de saída"
                    valor="15:30"
                  />

                  <DadoExemplo
                    titulo="Taxa de acerto"
                    valor="76,19%"
                  />

                  <DadoExemplo
                    titulo="Retorno médio"
                    valor="1,55%"
                  />
                </div>

                <div className="mt-4 grid gap-3 min-[380px]:grid-cols-3">
                  <DadoPequeno
                    titulo="Ocorrências"
                    valor="84"
                  />

                  <DadoPequeno
                    titulo="Acertos"
                    valor="64"
                  />

                  <DadoPequeno
                    titulo="Falhas"
                    valor="20"
                  />
                </div>
              </div>

              <p className="mt-4 px-2 text-center text-xs leading-5 text-slate-600">
                Exemplo ilustrativo. Resultados históricos não garantem
                desempenhos futuros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-9 text-center sm:grid-cols-2 lg:grid-cols-4">
          <Estatistica
            valor="300+"
            descricao="ações brasileiras monitoradas"
          />

          <Estatistica
            valor="1 milhão+"
            descricao="candles históricos armazenados"
          />

          <Estatistica
            valor="880 mil+"
            descricao="padrões estatísticos analisados"
          />

          <Estatistica
            valor="180+"
            descricao="padrões aprovados na última análise"
          />
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Para quem tem pouco tempo
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              A Bolsa não precisa ocupar todo o seu dia.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              Trabalho, família e compromissos tornam difícil acompanhar
              dezenas de ações e interpretar cada movimento do mercado.
              O Padrões B3 transforma uma grande quantidade de dados em
              informações objetivas para sua análise.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-3">
            <Problema
              numero="01"
              titulo="Pouco tempo para estudar"
              descricao="Você não precisa analisar centenas de gráficos todos os dias para descobrir onde pode existir uma oportunidade."
            />

            <Problema
              numero="02"
              titulo="Excesso de informações"
              descricao="Em vez de notícias, opiniões e indicadores espalhados, você recebe uma análise estatística organizada."
            />

            <Problema
              numero="03"
              titulo="Decisões sem referência"
              descricao="Veja como padrões semelhantes se comportaram no passado antes de decidir o que fazer."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Menos esforço manual
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Troque horas procurando sinais por uma análise organizada.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              O Padrões B3 não decide por você. Ele reduz o trabalho de
              procurar, testar e organizar informações em centenas de
              ações brasileiras.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-14 lg:grid-cols-2">
            <Comparacao
              titulo="Sem o Padrões B3"
              tipo="negativo"
              itens={[
                "Abrir e analisar dezenas de gráficos manualmente",
                "Perder tempo tentando encontrar padrões recorrentes",
                "Tomar decisões sem conhecer a taxa de acerto histórica",
                "Misturar opiniões, notícias e emoções na análise",
                "Não saber como situações semelhantes terminaram no passado",
              ]}
            />

            <Comparacao
              titulo="Com o Padrões B3"
              tipo="positivo"
              itens={[
                "Receber oportunidades já organizadas pelo scanner",
                "Consultar taxa de acerto, retorno médio e ocorrências",
                "Ver horários de entrada e saída da estratégia testada",
                "Acompanhar centenas de ações em um único painel",
                "Usar dados históricos como apoio à sua própria decisão",
              ]}
            />
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-20 border-y border-white/10 bg-[#07111f] px-4 py-20 sm:scroll-mt-24 sm:px-6 sm:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Como funciona
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Da análise histórica ao alerta na sua caixa de entrada.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              O sistema combina laboratório estatístico, backtests e
              monitoramento automático do mercado brasileiro.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2">
            {etapas.map((etapa) => (
              <article
                key={etapa.numero}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7"
              >
                <p className="text-sm font-semibold text-blue-400">
                  {etapa.numero}
                </p>

                <h3 className="mt-4 text-xl font-semibold sm:mt-5">
                  {etapa.titulo}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                  {etapa.descricao}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="beneficios"
        className="scroll-mt-20 px-4 py-20 sm:scroll-mt-24 sm:px-6 sm:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Benefícios
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Mais informação e menos tempo procurando oportunidades.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              Uma ferramenta desenvolvida para quem quer acompanhar
              ações da B3 com mais organização, praticidade e apoio
              estatístico.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((beneficio) => (
              <article
                key={beneficio.titulo}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:border-blue-500/30 hover:bg-blue-500/[0.04] sm:p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 font-semibold text-blue-300">
                  ✓
                </span>

                <h3 className="mt-5 text-xl font-semibold sm:mt-6">
                  {beneficio.titulo}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                  {beneficio.descricao}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02] px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Informações objetivas
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Entenda o motivo de cada oportunidade.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              O Padrões B3 não mostra apenas o nome de uma ação. Cada
              análise apresenta os dados históricos necessários para
              você entender como aquele padrão se comportou.
            </p>

            <div className="mt-7 space-y-4 sm:mt-8">
              <ItemInformacao texto="Estratégia identificada pelo scanner" />
              <ItemInformacao texto="Horário indicado para entrada e saída" />
              <ItemInformacao texto="Taxa de acerto histórica" />
              <ItemInformacao texto="Retorno médio das ocorrências anteriores" />
              <ItemInformacao texto="Quantidade de acertos e falhas" />
              <ItemInformacao texto="Score de confiança do padrão" />
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0a1019] p-5 shadow-2xl shadow-black/40 sm:rounded-[28px] sm:p-7">
            <p className="text-sm text-slate-500">
              Oportunidade Premium
            </p>

            <div className="mt-5 flex flex-col gap-4 min-[380px]:flex-row min-[380px]:items-end min-[380px]:justify-between">
              <div>
                <p className="text-3xl font-semibold sm:text-4xl">
                  PETR4
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Petróleo, gás e biocombustíveis
                </p>
              </div>

              <span className="w-fit rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                Alta confiança
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 sm:mt-7 sm:p-5">
              <p className="text-sm text-slate-500">
                Estratégia
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-200 sm:text-base sm:leading-7">
                2 quedas consecutivas com preço abaixo da média móvel
                de 20 períodos
              </p>
            </div>

            <div className="mt-4 grid gap-4 min-[380px]:grid-cols-2">
              <DadoExemplo
                titulo="Comprar"
                valor="11:30"
              />

              <DadoExemplo
                titulo="Vender"
                valor="14:30"
              />

              <DadoExemplo
                titulo="Taxa de acerto"
                valor="74,20%"
              />

              <DadoExemplo
                titulo="Retorno médio"
                valor="1,82%"
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="planos"
        className="scroll-mt-20 px-4 py-20 sm:scroll-mt-24 sm:px-6 sm:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Planos
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Comece gratuitamente e evolua quando precisar.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-400 sm:mt-6 sm:text-lg sm:leading-8">
              Escolha o plano ideal para a forma como você acompanha o
              mercado de ações.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:mt-14 lg:grid-cols-3">
            <Plano
              nome="Grátis"
              preco="R$ 0"
              periodo="para sempre"
              descricao="Para conhecer o Padrões B3 antes de assinar."
              beneficios={[
                "Uma oportunidade quando houver sinal disponível",
                "Taxa de acerto histórica",
                "Retorno médio histórico",
                "Acesso à área do cliente",
              ]}
              textoBotao="Criar conta grátis"
              caminho="/cliente/cadastro"
            />

            <Plano
              nome="Premium Mensal"
              preco="R$ 20"
              periodo="por mês"
              descricao="Acesso completo sem compromisso anual."
              beneficios={[
                "Todas as oportunidades disponíveis",
                "Estatísticas completas dos padrões",
                "Atualizações durante o pregão",
                "Alertas de oportunidades por e-mail",
                "Cancelamento a qualquer momento",
              ]}
              textoBotao="Começar no mensal"
              caminho="/cliente/cadastro"
            />

            <Plano
              nome="Premium Anual"
              preco="R$ 180"
              periodo="por ano"
              descricao="A opção com melhor economia no longo prazo."
              beneficios={[
                "Todos os benefícios do plano mensal",
                "Acesso Premium por 12 meses",
                "Equivale a R$ 15 por mês",
                "Economia de R$ 60 no ano",
                "Menos preocupação com renovações",
              ]}
              textoBotao="Escolher plano anual"
              caminho="/cliente/cadastro"
              destaque="Melhor custo-benefício"
            />
          </div>
        </div>
      </section>

      <section
        id="perguntas"
        className="scroll-mt-20 border-y border-white/10 bg-[#07111f] px-4 py-20 sm:scroll-mt-24 sm:px-6 sm:py-24 lg:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 sm:text-sm sm:tracking-[0.25em]">
              Perguntas frequentes
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              Tire suas dúvidas sobre o Padrões B3.
            </h2>
          </div>

          <div className="mt-10 space-y-4 sm:mt-14">
            {perguntas.map((item) => (
              <details
                key={item.pergunta}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
              >
                <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-4 font-medium text-slate-100">
                  <span className="pr-2">
                    {item.pergunta}
                  </span>

                  <span className="shrink-0 text-2xl font-light text-blue-400 transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
                  {item.resposta}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl rounded-2xl border border-blue-500/20 bg-blue-500/[0.08] p-6 text-center shadow-2xl shadow-blue-950/30 sm:rounded-[32px] sm:p-14">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-300 sm:text-sm sm:tracking-[0.25em]">
            Dê o primeiro passo
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Use seu tempo para decidir, não para procurar em centenas de gráficos.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-blue-100/70 sm:mt-6 sm:text-lg sm:leading-8">
            Crie sua conta gratuita e veja como dados históricos da
            Bolsa de Valores podem ser transformados em análises mais
            claras, rápidas e organizadas.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-4">
            <Link
              href="/cliente/cadastro"
              className="flex min-h-14 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center font-medium text-white transition hover:bg-blue-500 sm:w-auto sm:px-8"
            >
              Criar conta gratuitamente
            </Link>

            <Link
              href="/cliente"
              className="flex min-h-14 w-full items-center justify-center rounded-xl border border-white/10 bg-black/10 px-6 text-center font-medium text-slate-200 transition hover:bg-white/5 sm:w-auto sm:px-8"
            >
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-amber-500/15 bg-amber-500/[0.04] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-medium text-amber-200">
            Aviso importante sobre investimentos
          </h2>

          <p className="mt-3 max-w-5xl text-sm leading-7 text-amber-200/60">
            O Padrões B3 é uma ferramenta de apoio baseada em análises
            estatísticas e dados históricos. As informações apresentadas
            não constituem recomendação de compra ou venda, consultoria
            financeira ou garantia de rentabilidade. Investimentos em
            ações envolvem riscos e podem resultar em perdas.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#030509] px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row">
          <div>
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
                <p className="font-semibold">
                  Padrões B3
                </p>

                <p className="text-xs text-slate-500">
                  Inteligência estatística para ações brasileiras
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
              Plataforma de análise de padrões históricos, backtests e
              monitoramento automático de oportunidades na B3.
            </p>
          </div>

          <div className="grid gap-8 min-[380px]:grid-cols-2 sm:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Plataforma
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-500">
                <p>
                  <a
                    href="#como-funciona"
                    className="transition hover:text-white"
                  >
                    Como funciona
                  </a>
                </p>

                <p>
                  <a
                    href="#beneficios"
                    className="transition hover:text-white"
                  >
                    Benefícios
                  </a>
                </p>

                <p>
                  <a
                    href="#planos"
                    className="transition hover:text-white"
                  >
                    Planos
                  </a>
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-200">
                Conta
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-500">
                <p>
                  <Link
                    href="/cliente"
                    className="transition hover:text-white"
                  >
                    Fazer login
                  </Link>
                </p>

                <p>
                  <Link
                    href="/cliente/cadastro"
                    className="transition hover:text-white"
                  >
                    Criar conta
                  </Link>
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-200">
                Informações
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-500">
                <p>
                  <Link
                    href="/termos"
                    className="transition hover:text-white"
                  >
                    Termos de uso
                  </Link>
                </p>

                <p>
                  <Link
                    href="/privacidade"
                    className="transition hover:text-white"
                  >
                    Privacidade
                  </Link>
                </p>

                <p>
                  <Link
                    href="/contato"
                    className="transition hover:text-white"
                  >
                    Contato
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs leading-5 text-slate-600 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Padrões B3. Todos os direitos
            reservados.
          </p>

          <p>
            Análises históricas não garantem resultados futuros.
          </p>
        </div>
      </footer>
    </main>
  );
}


function InformacaoRapida({
  texto,
}: {
  texto: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400/70" />

      {texto}
    </span>
  );
}


function DadoExemplo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className="mt-2 break-words text-lg font-semibold text-slate-100">
        {valor}
      </p>
    </div>
  );
}


function DadoPequeno({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
      <p className="break-words text-[11px] text-slate-600">
        {titulo}
      </p>

      <p className="mt-1 font-medium text-slate-300">
        {valor}
      </p>
    </div>
  );
}


function Estatistica({
  valor,
  descricao,
}: {
  valor: string;
  descricao: string;
}) {
  return (
    <article>
      <p className="text-3xl font-semibold text-white">
        {valor}
      </p>

      <p className="mx-auto mt-2 max-w-52 text-sm leading-6 text-slate-500">
        {descricao}
      </p>
    </article>
  );
}


function Problema({
  numero,
  titulo,
  descricao,
}: {
  numero: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <p className="text-sm font-semibold text-blue-400">
        {numero}
      </p>

      <h3 className="mt-4 text-xl font-semibold sm:mt-5">
        {titulo}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
        {descricao}
      </p>
    </article>
  );
}


function ItemInformacao({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-xs text-blue-300">
        ✓
      </span>

      <span className="text-sm leading-6 text-slate-300 sm:text-base">
        {texto}
      </span>
    </div>
  );
}


function Comparacao({
  titulo,
  tipo,
  itens,
}: {
  titulo: string;
  tipo: "positivo" | "negativo";
  itens: string[];
}) {
  const positivo = tipo === "positivo";

  return (
    <article
      className={`rounded-2xl border p-5 sm:p-7 ${
        positivo
          ? "border-emerald-500/20 bg-emerald-500/[0.05]"
          : "border-red-500/15 bg-red-500/[0.03]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-semibold ${
            positivo
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          {positivo ? "✓" : "×"}
        </span>

        <h3 className="text-xl font-semibold text-white">
          {titulo}
        </h3>
      </div>

      <ul className="mt-6 space-y-4">
        {itens.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm leading-6 text-slate-300 sm:text-base"
          >
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                positivo
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-red-500/10 text-red-300"
              }`}
            >
              {positivo ? "✓" : "×"}
            </span>

            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}


function Plano({
  nome,
  preco,
  periodo,
  descricao,
  beneficios,
  textoBotao,
  caminho,
  destaque,
}: {
  nome: string;
  preco: string;
  periodo: string;
  descricao: string;
  beneficios: string[];
  textoBotao: string;
  caminho: string;
  destaque?: string;
}) {
  return (
    <article
      className={`relative flex min-w-0 flex-col rounded-2xl border p-5 sm:rounded-[28px] sm:p-7 ${
        destaque
          ? "border-blue-500/40 bg-blue-500/[0.08]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-start min-[380px]:justify-between">
        <p className="text-sm text-slate-400">
          {nome}
        </p>

        {destaque && (
          <span className="w-fit rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            {destaque}
          </span>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
        <p className="text-4xl font-semibold">
          {preco}
        </p>

        <p className="pb-1 text-sm text-slate-500">
          {periodo}
        </p>
      </div>

      <p className="mt-5 leading-7 text-slate-400 lg:min-h-14">
        {descricao}
      </p>

      <div className="mt-7 border-t border-white/10 pt-7">
        <p className="text-sm font-medium">
          Benefícios incluídos
        </p>

        <ul className="mt-5 space-y-4">
          {beneficios.map((beneficio) => (
            <li
              key={beneficio}
              className="flex items-start gap-3 text-sm leading-6 text-slate-300"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />

              <span>
                {beneficio}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={caminho}
        className={`mt-8 flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-center text-sm font-medium transition ${
          destaque
            ? "bg-blue-600 text-white hover:bg-blue-500"
            : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
        }`}
      >
        {textoBotao}
      </Link>
    </article>
  );
}
