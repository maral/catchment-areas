"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SchoolType } from "@/types/basicTypes";

export type Segment = {
  label: string;
  icon: React.ElementType;
  value: SchoolType;
};

export function SwitchButton({
  segments = [],
  defaultValue = segments[0]?.value,
  onValueChange,
}: {
  segments?: Segment[];
  defaultValue?: SchoolType;
  onValueChange?: (value: any) => void;
}) {
  const handleValueChange = (value: string) => {
    if (onValueChange) {
      onValueChange(Number(value) as SchoolType);
    }
  };

  return (
    <Tabs
      defaultValue={String(defaultValue)}
      onValueChange={handleValueChange}
      className="h-[50px] w-full "
    >
      <TabsList className="h-full p-[5px] w-full border border-gray-300 rounded-md">
        {segments.map((segment, idx) => {
          const Icon = segment.icon;
          const activeBg =
            idx % 2 === 1
              ? `data-[state=active]:bg-[#03b703]`
              : `data-[state=active]:bg-[#155dfc]`;
          return (
            <TabsTrigger
              key={segment.value}
              className={`rounded-sm text-gray-900 data-[state=inactive]:cursor-pointer data-[state=active]:text-white data-[state=active]:font-medium ${activeBg}`}
              value={String(segment.value)}
            >
              <Icon /> {segment.label}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
