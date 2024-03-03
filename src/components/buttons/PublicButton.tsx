import { Color, Icon } from "@tremor/react";

export default function PublicButton({
  icon,
  onClick,
  href,
  target,
  size = "md",
  tooltip,
  color = "slate",
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
  size?: "sm" | "md" | "lg";
  color?: Color;
  tooltip?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const ButtonComponent = onClick ? "button" : "a";

  return (
    <ButtonComponent
      className={`
        ${className ?? ""}
        border rounded-md cursor-pointer bg-white hover:bg-slate-100 border-gray-300
        block px-3 py-2 transition-colors shadow text-slate-700 hover:text-slate-800
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
