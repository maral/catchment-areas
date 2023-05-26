import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IconProps {
  icon: IconProp;
  className?: string;
}

export default function Icon({ icon, className }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={`${className ?? ""} w-8 h-8 inline-block`}
    />
  );
}
