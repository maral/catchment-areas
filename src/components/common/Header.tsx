export default function Header({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`text-3xl text-slate-600 font-title font-medium ${className ?? ''}`}>
      {children}
    </h1>
  )
}
