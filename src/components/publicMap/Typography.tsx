export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 mt-8 text-xl font-semibold">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4">{children}</p>;
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-6 mb-4">{children}</ul>;
}
