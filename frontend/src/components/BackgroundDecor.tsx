export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="orb orb-fast absolute -top-32 right-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="orb absolute top-40 -left-24 h-80 w-80 rounded-full bg-teal/20 blur-3xl" />
      <div className="orb orb-slow absolute bottom-16 right-24 h-96 w-96 rounded-full bg-moss/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-ink/10" />
      <div className="absolute -left-20 top-24 h-48 w-[26rem] rotate-[-6deg] rounded-[40px] border border-ink/10 bg-white/40 backdrop-blur-sm" />
      <div className="absolute -right-16 bottom-24 h-44 w-[22rem] rotate-[7deg] rounded-[36px] border border-ink/10 bg-white/35 backdrop-blur-sm" />
    </div>
  );
}
