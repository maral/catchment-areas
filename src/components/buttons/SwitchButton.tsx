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
  return (
    <Tabs
      defaultValue={String(defaultValue)}
      onValueChange={onValueChange}
      className="h-[50px] w-full "
    >
      <TabsList className="h-full p-[5px] w-full border border-gray-300 rounded-md">
        {segments.map((segment, idx) => {
          const Icon = segment.icon;
          const colors = ["#155dfc", "#03b703"];
          const activeBg = `data-[state=active]:bg-[${
            colors[idx % colors.length]
          }]`;
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
