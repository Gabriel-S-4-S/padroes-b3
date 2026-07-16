type StatCardProps = {
  titulo: string;
  valor: string | number;
  descricao?: string;
};

export default function StatCard({
  titulo,
  valor,
  descricao,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-slate-400">{titulo}</p>

      <p className="mt-4 text-4xl font-semibold text-white">
        {valor}
      </p>

      {descricao && (
        <p className="mt-3 text-xs text-slate-500">{descricao}</p>
      )}
    </article>
  );
}