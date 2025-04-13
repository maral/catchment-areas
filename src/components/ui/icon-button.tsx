import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Button, ButtonSize } from "./button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

const iconButtonVariants = cva("", {
  variants: {
    variant: {
      default: "text-primary",
      destructive: "text-destructive",
      secondary: "text-secondary-foreground",
    },
  },
  defaultVariants: {
    variant: "secondary",
  },
});

export type IconButtonVariant = VariantProps<
  typeof iconButtonVariants
>["variant"];

export type IconButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    icon: React.ElementType;
    size: ButtonSize;
    tooltip: string;
  };

function IconButton({
  className,
  variant,
  size,
  icon: Icon,
  tooltip,
  ...props
}: IconButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary" size={size} {...props}>
            <Icon className={cn(iconButtonVariants({ variant, className }))} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { IconButton, iconButtonVariants };
