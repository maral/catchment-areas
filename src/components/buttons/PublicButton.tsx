import { Color, Icon } from "@tremor/react";

export default function PublicButton({
  icon,
  onClick,
  href,
  target,
  size = "md",
  color = "slate",
  variant = "outline",
  className,
  children,
}: {
  icon?: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  onClick?: () => void;
  href?: string;
  target?: string;
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg";
  color?: Color;
  className?: string;
  children?: React.ReactNode;
}) {
  const ButtonComponent = onClick ? "button" : "a";

  const colorClasses =
    variant === "primary"
      ? "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white hover:text-white"
      : "bg-white hover:bg-slate-100 border-gray-300 text-slate-700 hover:text-slate-800";

  return (
    <ButtonComponent
      className={`
        ${className ?? ""} ${colorClasses}
        border rounded-md cursor-pointer 
        block px-3 py-2 transition-colors shadow
      `}
      onClick={onClick}
      href={href}
      target={target}
    >
      {icon && (
        <Icon
          icon={icon}
          color={color}
          size={size}
          className={`p-0 relative top-[4px] ${children && "pr-2"}`}
        />
      )}
      {children}
    </ButtonComponent>
  );
}
