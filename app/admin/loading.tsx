export default function AdminLoading() {
  return (
    <main className="section-padding animate-pulse">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <div className="h-[70vh] rounded-[32px] border border-border bg-white/70" />
        <div className="grid gap-5">
          <div className="h-24 rounded-[28px] border border-border bg-white/70" />
          <div className="h-[55vh] rounded-[32px] border border-border bg-white/70" />
        </div>
      </div>
    </main>
  );
}
