export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-fast absolute -top-24 right-16 h-64 w-64 rounded-full bg-ink/10 blur-3xl" />
      <div className="orb absolute top-48 -left-24 h-72 w-72 rounded-full bg-ink/10 blur-3xl" />
      <div className="orb orb-slow absolute bottom-20 right-32 h-80 w-80 rounded-full bg-ink/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-ink/10" />
      <div className="absolute -left-24 top-28 h-48 w-[26rem] rotate-[-6deg] rounded-[40px] border border-ink/15 bg-white/60 backdrop-blur-sm" />
      <div className="absolute -right-20 bottom-20 h-44 w-[22rem] rotate-[7deg] rounded-[36px] border border-ink/15 bg-white/55 backdrop-blur-sm" />
      <div className="absolute left-10 top-12 h-24 w-24 rounded-full border border-ink/20 bg-white/40" />
      <div className="absolute right-20 bottom-12 h-16 w-32 -rotate-3 rounded-[28px] border border-ink/20 bg-white/40" />
    </div>
  );
}
