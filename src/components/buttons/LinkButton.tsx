import { Button } from "@tremor/react";
import Link, { LinkProps } from "next/link";
import { AnchorHTMLAttributes } from "react";

interface LinkButtonProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    LinkProps {
  href: string;
  buttonProps?: React.ComponentProps<typeof Button>;
}

export default function LinkButton({
  href,
  children,
  className,
  buttonProps,
  ...props
}: LinkButtonProps) {
  return (
    <div className={className ?? ''}>
      <Link
        href={buttonProps?.disabled ? {} : href}
        prefetch={false}
        {...props}
      >
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