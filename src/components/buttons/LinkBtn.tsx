import { Button } from "@tremor/react";
import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes } from "react";

interface LinkBtnProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    LinkProps {
  href: string;
  buttonProps?: React.ComponentProps<typeof Button>;
}

export default function LinkBtn({
  href,
  children,
  className,
  buttonProps,
  ...props
}: LinkBtnProps) {
  return (
    <Link className={className ?? ""} href={href} {...props}>
      <Button {...buttonProps}>{children}</Button>
    </Link>
  );
}
