export default function Select(
  {
    items,
    selectValue,
    onValueChange,
    size,
    className,
  }: {
    items: string[] | number[];
    selectValue?: string | number;
    onValueChange: (value: string | number) => void;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
) {
  const sizeToHeight = (size?: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'h-8';
      case 'md':
        return 'h-10';
      case 'lg':
        return 'h-12';
      default:
        return 'h-10';
    }
  }

  return (
    <div className={className ?? ""}>
      <select
        className={`
          bg-slate-50
          border
          border-slate-200
          cursor-pointer
          rounded-md
          hover:bg-slate-50
          w-full
          p-2
          text-tremor-default
          ${sizeToHeight(size)}
        `}
        value={selectValue}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {items.map((item, index) => (
          <option key={index}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
