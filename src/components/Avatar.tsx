import Image from "next/image";

type AvatarSize = 'sm' | 'md' | 'lg';

export default function Avatar({
  className,
  image,
  size
}: {
  className: string;
  image: string;
  size?: AvatarSize;
}) {
  const sizeInPixels = (size?: AvatarSize) => {
    switch (size) {
      case 'sm':
        return 36;
      case 'md':
        return 48;
      case 'lg':
        return 60;
      default:
        return 48;
    }
  }

  return (
    <>
      <Image
        className={`rounded-full p-1 ${className ?? ""}`}
        width={sizeInPixels(size)}
        height={sizeInPixels(size)}
        src={image}
        alt="Fotka uživatele"
      />
    </>
  )
}