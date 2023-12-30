import { Icon } from "@tremor/react";
import Image from "next/image";
import { UserIcon } from "@heroicons/react/24/solid";
import { Colors } from "@/styles/Themes";

type AvatarSize = "sm" | "md" | "lg";

type Icon = React.ForwardRefExoticComponent<
  Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
    title?: string | undefined;
    titleId?: string | undefined;
  } & React.RefAttributes<SVGSVGElement>
>;

export default function Avatar({
  className,
  image,
  size,
}: {
  className: string;
  image?: string | null;
  size?: AvatarSize;
}) {
  const sizeInPixels = (size?: AvatarSize) => {
    switch (size) {
      case "sm":
        return 36;
      case "md":
        return 48;
      case "lg":
        return 60;
      default:
        return 48;
    }
  };

  return (
    <>
      {image ? (
        <Image
          className={`rounded-full p-1 ${className ?? ""}`}
          width={sizeInPixels(size)}
          height={sizeInPixels(size)}
          src={image}
          alt="Fotka uživatele"
        />
      ) : (
        <Icon
          icon={UserIcon}
          color={Colors.Secondary}
          className={`rounded-full border border-slate-400 ${className ?? ""}`}
        />
      )}
    </>
  );
}
