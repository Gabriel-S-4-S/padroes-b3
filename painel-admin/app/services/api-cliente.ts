const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type ApiOptions = RequestInit & {
  usarToken?: boolean;
};

export async function apiClienteFetch<T>(
  caminho: string,
  opcoes: ApiOptions = {}
): Promise<T> {
  const {
    usarToken = true,
    headers,
    ...restante
  } = opcoes;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token_cliente")
      : null;

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...restante,
    headers: {
      "Content-Type": "application/json",

      ...(usarToken && token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),

      ...headers,
    },
  });

  if (resposta.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token_cliente");
      localStorage.removeItem("usuario_cliente");

      window.location.href = "/cliente";
    }

    throw new Error("Sua sessão expirou.");
  }

  let dados;

  try {
    dados = await resposta.json();
  } catch {
    throw new Error("A API retornou uma resposta inválida.");
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.detail ??
        dados?.mensagem ??
        "Não foi possível comunicar com a API."
    );
  }

  return dados as T;
}