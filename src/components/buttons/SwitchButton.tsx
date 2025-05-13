"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

export default function SwitchButton({
  leftLabel,
  rightLabel,
  leftValue,
  rightIcon,
  leftIcon,
  rightValue,
  defaultValue = rightValue,
  onValueChange,
}: {
  leftLabel: string;
  rightLabel: string;
  rightIcon: React.ElementType;
  leftIcon: React.ElementType;
  leftValue: any;
  rightValue: any;
  defaultValue?: any;
  onValueChange?: (value: any) => void;
}) {
  const IconLeft = leftIcon;
  const IconRight = rightIcon;

  return (
    <Tabs
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      className="h-[50px] w-full "
    >
      <TabsList className="h-full p-[5px] w-full border border-gray-300 rounded-md">
        <TabsTrigger
          className="rounded-sm  text-gray-900 data-[state=inactive]:cursor-pointer data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:font-medium"
          value={leftValue}
        >
          <IconLeft />
          {leftLabel}
        </TabsTrigger>
        <TabsTrigger
          className="rounded-sm  text-gray-900 data-[state=inactive]:cursor-pointer data-[state=active]:bg-[#03b703] data-[state=active]:text-white data-[state=active]:font-medium"
          value={rightValue}
        >
          <IconRight /> {rightLabel}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
