import PublicMap from "@/components/publicMap/PublicMap";
import { SchoolType } from "@/types/basicTypes";
import { getCitiesForMap } from "@/utils/server/map";
import { notFound } from "next/navigation";

export default async function MapPage() {
  const cities = await getCitiesForMap();

  if (cities === null) {
    notFound();
  }

  return <PublicMap schoolType={SchoolType.Elementary} cities={cities} />;
}
