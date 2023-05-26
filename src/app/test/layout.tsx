export default function TestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-300 p-40 rounded-3xl">{children}</div>
  );
}