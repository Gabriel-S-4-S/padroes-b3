import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "Padrões B3 — análise estatística de ações brasileiras";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #030509 0%, #07111f 55%, #05070b 100%)",
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 520,
            top: -180,
            right: -80,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0) 70%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            bottom: -220,
            left: -120,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(29, 78, 216, 0.22) 0%, rgba(29, 78, 216, 0) 70%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 32,
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 32,
          }}
        />

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "72px 84px",
            gap: 60,
          }}
        >
          <div
            style={{
              width: 710,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 66,
                  height: 66,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 18,
                  background:
                    "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  boxShadow:
                    "0 18px 45px rgba(37, 99, 235, 0.28)",
                  fontSize: 25,
                  fontWeight: 800,
                  letterSpacing: "-1px",
                }}
              >
                PB3
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  Padrões B3
                </span>

                <span
                  style={{
                    marginTop: 5,
                    fontSize: 17,
                    color: "#64748b",
                  }}
                >
                  Inteligência estatística para ações brasileiras
                </span>
              </div>
            </div>

            <h1
              style={{
                maxWidth: 700,
                margin: "54px 0 0",
                fontSize: 61,
                lineHeight: 1.05,
                letterSpacing: "-2.8px",
                fontWeight: 750,
              }}
            >
              Encontre oportunidades na B3 sem passar o dia analisando
              gráficos.
            </h1>

            <p
              style={{
                maxWidth: 650,
                margin: "28px 0 0",
                fontSize: 24,
                lineHeight: 1.45,
                color: "#94a3b8",
              }}
            >
              Scanner automático, backtests, taxa de acerto, retorno
              médio e histórico de ocorrências.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                marginTop: 40,
                fontSize: 17,
                color: "#93c5fd",
              }}
            >
              <Item texto="Ações brasileiras" />
              <Item texto="Dados históricos" />
              <Item texto="Alertas Premium" />
            </div>
          </div>

          <div
            style={{
              width: 310,
              display: "flex",
              flexDirection: "column",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              borderRadius: 28,
              background: "rgba(255, 255, 255, 0.04)",
              padding: 28,
              boxShadow:
                "0 30px 80px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  color: "#60a5fa",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                }}
              >
                Exemplo
              </span>

              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "rgba(16, 185, 129, 0.12)",
                  border: "1px solid rgba(16, 185, 129, 0.22)",
                  color: "#6ee7b7",
                  fontSize: 13,
                }}
              >
                Scanner ativo
              </span>
            </div>

            <span
              style={{
                marginTop: 30,
                fontSize: 18,
                color: "#64748b",
              }}
            >
              Ação analisada
            </span>

            <span
              style={{
                marginTop: 6,
                fontSize: 54,
                fontWeight: 750,
                letterSpacing: "-2px",
              }}
            >
              VALE3
            </span>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginTop: 28,
                gap: 12,
              }}
            >
              <Dado titulo="Taxa de acerto" valor="76,19%" />
              <Dado titulo="Retorno médio" valor="1,55%" />
              <Dado titulo="Score estatístico" valor="92/100" />
            </div>

            <span
              style={{
                marginTop: 24,
                fontSize: 13,
                lineHeight: 1.5,
                color: "#475569",
              }}
            >
              Exemplo ilustrativo. Resultados históricos não garantem
              resultados futuros.
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

function Item({
  texto,
}: {
  texto: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#3b82f6",
        }}
      />

      <span>{texto}</span>
    </div>
  );
}

function Dado({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        borderRadius: 14,
        background: "rgba(0, 0, 0, 0.18)",
        padding: "14px 15px",
      }}
    >
      <span
        style={{
          fontSize: 14,
          color: "#64748b",
        }}
      >
        {titulo}
      </span>

      <span
        style={{
          fontSize: 17,
          fontWeight: 700,
          color: "#e2e8f0",
        }}
      >
        {valor}
      </span>
    </div>
  );
}