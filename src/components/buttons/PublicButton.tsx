export default function PublicButton({
  icon,
  onClick,
  href,
  target,
  variant = "outline",
  className,
  children,
}: {
  icon?: React.ElementType;
  onClick?: () => void;
  href?: string;
  target?: string;
  variant?: "primary" | "outline";
  className?: string;
  children?: React.ReactNode;
}) {
  const ButtonComponent = onClick ? "button" : "a";
  const IconComponent = icon ?? null;

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
      {IconComponent && (
        <IconComponent
          className={`w-5 inline-block text-amber-500 relative top-[-2px] mr-2`}
        />
      )}
      {children}
    </ButtonComponent>
  );
}
