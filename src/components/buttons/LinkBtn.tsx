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
    <Link
        className={className ?? ''}
        href={href}
    >
      <Button {...buttonProps}>
        {children}
      </Button>
    </Link>
  );
}