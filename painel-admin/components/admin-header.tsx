"use client";

type UsuarioAdmin = {
  nome: string;
  email: string;
};

type AdminHeaderProps = {
  titulo: string;
  subtitulo?: string;
  usuario: UsuarioAdmin | null;
};

export default function AdminHeader({
  titulo,
  subtitulo,
  usuario,
}: AdminHeaderProps) {
  function sair() {
    localStorage.removeItem("token_admin");
    localStorage.removeItem("usuario_admin");

    window.location.href = "/";
  }

  return (
    <header className="flex min-h-20 items-center justify-between border-b border-white/10 px-6 py-4 lg:px-10">
      <div>
        <h2 className="text-xl font-semibold text-white">{titulo}</h2>

        {subtitulo && (
          <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-white">
            {usuario?.nome ?? "Administrador"}
          </p>

          <p className="text-xs text-slate-500">
            {usuario?.email ?? ""}
          </p>
        </div>

        <button
          type="button"
          onClick={sair}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          Sair
        </button>
      </div>
    </header>
  );
}