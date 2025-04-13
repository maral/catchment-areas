import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes } from "react";
import { Button } from "../ui/button";

interface LinkButtonProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    LinkProps {
  href: string;
  buttonProps?: React.ComponentProps<typeof Button>;
}

export default function LinkButton({
  href,
  children,
  buttonProps,
  ...props
}: LinkButtonProps) {
  return (
    <Button asChild {...buttonProps}>
      <Link
        href={buttonProps?.disabled ? {} : href}
        prefetch={false}
        {...props}
      >
        {children}
      </Link>
    </Button>
  );
}
