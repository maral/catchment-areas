import Link from "next/link";

export default function CatchmentLink({
  href,
  children,
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={className ?? ""} prefetch={false}>
      <span className="text-emerald-500 hover:text-emerald-600 font-bold">
        {children}
      </span>
    </Link>
  );
}
