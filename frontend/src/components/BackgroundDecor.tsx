export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-fast absolute -top-28 right-8 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      <div className="orb absolute top-48 -left-32 h-96 w-96 rounded-full bg-teal/25 blur-3xl" />
      <div className="orb orb-slow absolute bottom-10 right-40 h-[28rem] w-[28rem] rounded-full bg-moss/25 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-ink/10" />
      <div className="absolute -left-32 top-24 h-52 w-[30rem] rotate-[-8deg] rounded-[44px] border border-white/10 bg-white/5 backdrop-blur-sm" />
      <div className="absolute -right-24 bottom-16 h-44 w-[24rem] rotate-[8deg] rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-sm" />
      <div className="absolute left-16 top-10 h-28 w-28 rounded-full border border-white/10 bg-white/5" />
      <div className="absolute right-24 bottom-10 h-20 w-36 -rotate-3 rounded-[28px] border border-white/10 bg-white/5" />
    </div>
  );
}
