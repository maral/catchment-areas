import { FounderController } from "../../controllers/FounderController";
import { api } from "../api/[...remult]/api";
import Embed from "./Embed";

export default async function EmbedPage() {
  const { cities, schools } = await api.withRemult(async () => ({
    cities: await FounderController.loadPublishedCities(),
    schools: await FounderController.loadPublishedSchools(),
  }));

  return <Embed schools={schools} cities={cities} />;
}
