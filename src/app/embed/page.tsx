import { CityController } from "../../controllers/CityController";
import { api } from "../api/[...remult]/api";
import Embed from "./Embed";

export default async function EmbedPage() {
  const { cities, schools } = await api.withRemult(async () => ({
    cities: await CityController.loadPublishedCities(),
    schools: await CityController.loadPublishedSchools(),
  }));

  return <Embed schools={schools} cities={cities} />;
}
