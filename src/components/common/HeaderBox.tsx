import Header from "./Header";

export default function HeaderBox({
  title,
  children,
  middleSlot,
  className,
  childrenWrapperClassName,
  middleSlotClassName,
}: {
  title: string;
  children?: React.ReactNode;
  middleSlot?: React.ReactNode;
  className?: string;
  childrenWrapperClassName?: string;
  middleSlotClassName?: string;
}) {
  return (
    <div className={`flex justify-between items-center h-14 mb-4 ${className}`}>
      <div>
        <Header>{ title }</Header>
      </div>
      <div className={middleSlotClassName ?? ''}>
        { middleSlot }
      </div>
      <div className={`flex items-center ${childrenWrapperClassName ?? ''}`}>
        { children }
      </div>
    </div>
  )
}
