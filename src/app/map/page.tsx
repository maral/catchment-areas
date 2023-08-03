import PublicMap from "@/components/publicMap/PublicMap";
import { getCitiesForMap } from "@/utils/server/map";
import { notFound } from "next/navigation";

export default async function MapPage() {
  const cities = await getCitiesForMap();

  if (cities === null) {
    notFound();
  }

  return <PublicMap cities={cities} />;
}
