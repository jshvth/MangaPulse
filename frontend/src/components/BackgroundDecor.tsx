export function BackgroundDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-32 right-12 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute top-40 -left-24 h-80 w-80 rounded-full bg-teal/20 blur-3xl" />
      <div className="absolute bottom-16 right-24 h-96 w-96 rounded-full bg-moss/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-ink/10" />
    </div>
  );
}
