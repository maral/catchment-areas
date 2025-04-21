"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { texts } from "@/utils/shared/texts";
import { useSearchParams, useRouter } from "next/navigation";

export default function RegionSelect({
  regions,
  selectedRegion,
}: {
  regions: { code: number; name: string }[];
  selectedRegion: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  function handleRegionChange(regionCode: string) {
    const params = new URLSearchParams(searchParams);
    if (regionCode === "all") {
      params.delete("region");
    } else {
      params.set("region", regionCode);
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Select onValueChange={handleRegionChange} value={selectedRegion}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{texts.allRegions}</SelectItem>
        {regions.map((region) => (
          <SelectItem key={region.code} value={region.code.toString()}>
            {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
