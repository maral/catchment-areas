import { CityController } from "@/controllers/CityController";
import { SchoolType } from "@/types/basicTypes";
import { api } from "../api/[...remult]/api";
import Embed from "./Embed";

export default async function EmbedPage() {
  const { cities, schools } = await api.withRemult(async () => ({
    cities: await CityController.loadPublishedCities(SchoolType.Elementary),
    schools: await CityController.loadPublishedSchools(SchoolType.Elementary),
  }));

  return <Embed schools={schools} cities={cities} />;
}
