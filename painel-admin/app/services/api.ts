const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

type ApiOptions = RequestInit & {
  usarToken?: boolean;
};

export async function apiFetch<T>(
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
      ? localStorage.getItem("token_admin")
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
      localStorage.removeItem("token_admin");
      localStorage.removeItem("usuario_admin");
      window.location.href = "/";
    }

    throw new Error("Sessão expirada.");
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
        "Erro ao comunicar com a API."
    );
  }

  return dados as T;
}