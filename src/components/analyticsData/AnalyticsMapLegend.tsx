"use client";

import { getColorByPercentage } from "@/utils/client/markers";
import { LegendItem } from "@/types/mapTypes";
import { texts } from "@/utils/shared/texts";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "../ui/tooltip";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface AnalyticsMapLegendProps {
  items: LegendItem[];
}

export default function AnalyticsMapLegend({ items }: AnalyticsMapLegendProps) {
  const getValue = (
    percent: number,
    minValue: string,
    maxValue: string
  ): string => {
    const min = parseFloat(minValue);
    const max = parseFloat(maxValue);
    const value = Math.round(min + (max - min) * (percent / 100));

    return minValue.includes("%") ? `${value}%` : String(value);
  };

  const percentages = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-md shadow-md bg-white border-gray-300 p-2">
      <div className="flex gap-4">
        <div className="flex flex-col ">
          <div className="h-8 flex items-center justify-center">
            {texts.legend}
          </div>
          <div className="mt-5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="text-gray-500 text-xs font-bold flex items-center justify-start gap-1"
              >
                <div dangerouslySetInnerHTML={{ __html: item.icon }} />
                <div>{item.title}</div>
                {item.description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="z-[2000]">
                        {item.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className=" w-full max-w-64 h-8 rounded mb-1 flex">
            {percentages.map((percent, idx) => {
              const width =
                idx < percentages.length - 1
                  ? percentages[idx + 1] - percent
                  : 0;
              return width > 0 ? (
                <div
                  key={idx}
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(to right, ${getColorByPercentage(
                      percent
                    )}, ${getColorByPercentage(percentages[idx + 1])})`,
                  }}
                />
              ) : null;
            })}
          </div>
          <div
            className="grid w-full max-w-64"
            style={{
              gridTemplateColumns: `repeat(${percentages.length}, 1fr)`,
              columnGap: "20px",
            }}
          >
            {percentages.map((percent, idx) => (
              <div
                key={`percent-${idx}`}
                className="text-xs text-gray-500 text-center font-bold"
              >
                {percent}%
              </div>
            ))}
            {items.map((item, idx) =>
              percentages.map((percent, pIdx) => (
                <div
                  key={`${idx}-${pIdx}`}
                  className="text-xs text-gray-400 font-mono text-center"
                >
                  {getValue(percent, item.minValue, item.maxValue)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
