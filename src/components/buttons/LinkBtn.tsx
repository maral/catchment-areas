import { Button } from "@tremor/react";
import Link from "next/link";

export default function LinkBtn({
  href,
  children,
  className,
  buttonProps,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
  buttonProps?: React.ComponentProps<typeof Button>;
}) {
  return (
    <div className={className ?? ''}>
      <Link href={href}>
        <Button
          className="w-full"
          {...buttonProps}
        >
          {children}
        </Button>
      </Link>
    </div>
  );
}