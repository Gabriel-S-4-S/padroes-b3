"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8000";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

type UsuarioGoogle = {
  id: number;
  nome: string;
  email: string;
  api_key: string;
  plano: string;
  status: string;
  expira_em: string | null;
  role: string;
  email_verificado: boolean;
  google_id?: string | null;
  provedor_login?: string | null;
  foto_perfil?: string | null;
};

type RespostaGoogle = {
  autenticado: boolean;
  mensagem?: string;
  token?: string;
  usuario?: UsuarioGoogle;
  novo_usuario?: boolean;
};

type CredencialGoogle = {
  credential?: string;
  select_by?: string;
};

type GoogleLoginButtonProps = {
  texto?: "signin_with" | "signup_with" | "continue_with";
  onErro?: (mensagem: string) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuracao: {
            client_id: string;
            callback: (
              resposta: CredencialGoogle
            ) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;

          renderButton: (
            elemento: HTMLElement,
            configuracao: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?:
                | "signin_with"
                | "signup_with"
                | "continue_with"
                | "signin";
              shape?:
                | "rectangular"
                | "pill"
                | "circle"
                | "square";
              logo_alignment?: "left" | "center";
              width?: number;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export default function GoogleLoginButton({
  texto = "continue_with",
  onErro,
}: GoogleLoginButtonProps) {
  const router = useRouter();

  const containerBotao = useRef<HTMLDivElement | null>(
    null
  );

  const [scriptCarregado, setScriptCarregado] =
    useState(false);

  const [processando, setProcessando] =
    useState(false);

  const [erroInterno, setErroInterno] =
    useState("");

  const exibirErro = useCallback(
    (mensagem: string) => {
      setErroInterno(mensagem);
      onErro?.(mensagem);
    },
    [onErro]
  );

  const processarCredencial = useCallback(
    async (respostaGoogle: CredencialGoogle) => {
      if (processando) {
        return;
      }

      const credential =
        respostaGoogle.credential?.trim();

      if (!credential) {
        exibirErro(
          "O Google não retornou uma credencial válida."
        );
        return;
      }

      setProcessando(true);
      setErroInterno("");

      try {
        const resposta = await fetch(
          `${API_URL}/auth/google`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              credential,
            }),
          }
        );

        let dados: RespostaGoogle;

        try {
          dados =
            (await resposta.json()) as RespostaGoogle;
        } catch {
          throw new Error(
            "A API retornou uma resposta inválida."
          );
        }

        if (!resposta.ok) {
          const detalhe = (
            dados as RespostaGoogle & {
              detail?: string;
            }
          ).detail;

          throw new Error(
            detalhe ??
              dados.mensagem ??
              "Não foi possível entrar com o Google."
          );
        }

        if (
          !dados.autenticado ||
          !dados.token ||
          !dados.usuario
        ) {
          throw new Error(
            dados.mensagem ??
              "O login com Google não foi concluído."
          );
        }

        if (dados.usuario.role !== "usuario") {
          throw new Error(
            "Esta conta não possui acesso à área do cliente."
          );
        }

        localStorage.setItem(
          "token_cliente",
          dados.token
        );

        localStorage.setItem(
          "usuario_cliente",
          JSON.stringify(dados.usuario)
        );

        router.replace("/cliente/dashboard");
        router.refresh();
      } catch (erroDesconhecido) {
        const mensagem =
          erroDesconhecido instanceof Error
            ? erroDesconhecido.message
            : "Não foi possível entrar com o Google.";

        exibirErro(mensagem);
      } finally {
        setProcessando(false);
      }
    },
    [
      exibirErro,
      processando,
      router,
    ]
  );

  const renderizarBotao = useCallback(() => {
    if (
      !scriptCarregado ||
      !containerBotao.current ||
      !window.google
    ) {
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      exibirErro(
        "O Client ID do Google não foi configurado no frontend."
      );
      return;
    }

    containerBotao.current.innerHTML = "";

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: processarCredencial,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    const larguraDisponivel = Math.floor(
      containerBotao.current.getBoundingClientRect()
        .width
    );

    window.google.accounts.id.renderButton(
      containerBotao.current,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        text: texto,
        shape: "rectangular",
        logo_alignment: "left",
        width: Math.max(
          240,
          Math.min(larguraDisponivel, 400)
        ),
        locale: "pt-BR",
      }
    );
  }, [
    exibirErro,
    processarCredencial,
    scriptCarregado,
    texto,
  ]);

  useEffect(() => {
    renderizarBotao();
  }, [renderizarBotao]);

  useEffect(() => {
    function redimensionar() {
      renderizarBotao();
    }

    window.addEventListener(
      "resize",
      redimensionar
    );

    return () => {
      window.removeEventListener(
        "resize",
        redimensionar
      );
    };
  }, [renderizarBotao]);

  return (
    <div className="w-full">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptCarregado(true)}
        onReady={() => setScriptCarregado(true)}
        onError={() =>
          exibirErro(
            "Não foi possível carregar o serviço de login do Google."
          )
        }
      />

      <div className="relative flex min-h-11 w-full justify-center">
        <div
          ref={containerBotao}
          className={`flex w-full justify-center transition ${
            processando
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        />

        {processando && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/90">
            <span className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />

              Entrando com Google...
            </span>
          </div>
        )}
      </div>

      {erroInterno && (
        <p
          role="alert"
          className="mt-3 text-center text-sm leading-6 text-red-300"
        >
          {erroInterno}
        </p>
      )}
    </div>
  );
}