import { Color, Icon } from "@tremor/react";

export default function IconButton({
  icon,
  onClick,
  size,
  tooltip,
  color = "slate",
  className,
}: {
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  color?: Color;
  tooltip?: string;
  className?: string;
}) {
  const sizeToHeight = (size?: "sm" | "md" | "lg") => {
    switch (size) {
      case "sm":
        return "h-8 w-8";
      case "md":
        return "h-9 w-9";
      case "lg":
        return "h-11 w-11";
      default:
        return "h-9 w-9";
    }
  };

  const sizeToIconSize = (size?: "sm" | "md" | "lg") => {
    switch (size) {
      case "sm":
        return "sm";
      case "md":
        return "md";
      case "lg":
        return "lg";
      default:
        return "md";
    }
  };

  return (
    <div
      className={`
        ${className ?? ""}
        bg-slate-50
        border
        border-slate-200
        cursor-pointer
        rounded-md
        hover:bg-slate-100
        ${sizeToHeight(size)}
      `}
    >
      <Icon
        icon={icon}
        variant="simple"
        color={color}
        tooltip={tooltip}
        size={sizeToIconSize(size)}
        onClick={onClick}
      />
    </div>
  );
}
