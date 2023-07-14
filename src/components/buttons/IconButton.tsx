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
        return "h-10 w-10";
      case "lg":
        return "h-12 w-12";
      default:
        return "h-10 w-10";
    }
  };

  const sizeToIconSize = (size?: "sm" | "md" | "lg") => {
    switch (size) {
      case "sm":
        return "xs";
      case "md":
        return "sm";
      case "lg":
        return "md";
      default:
        return "sm";
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
        m-1
        ${sizeToHeight(size)}
      `}
    >
      <Icon
        className="m-1"
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
