import { remult } from "remult";

import { Founder, FounderType } from "@/entities/Founder";
import { api } from "./api/[...remult]/route";

const foundersRepo = remult.repo(Founder);

export default async function Home() {
  // const founders = await api.withRemult(async () => await foundersRepo.find({ limit: 10 }));

  return (
    <>
      <h1 className="text-4xl text-rose-700 font-bold mb-8">
        Všichni zřizovatelé
      </h1>
      <p className="mb-24">Demo, jak používat Remult v Next.js. Staticky generované na serveru.</p>

      {/* <table>
        <thead>
          <tr>
            <th>Jméno</th>
            <th>Kraj</th>
            <th>Okres</th>
            <th>ORP</th>
            <th>Typ</th>
            <th>Počet škol</th>
            <th>Stav</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
        {founders.map((founder) => (
          <tr key={founder.id}>
            <td className="text-rose-700 font-bold p-2">{founder.name}</td>

            <td className="p-2">{founder.city.region.name}</td>
            <td className="p-2">{founder.city.county.name}</td>
            <td className="p-2">{founder.city.orp.name}</td>
            <td className="p-2">
              {founder.founderType === FounderType.City ? "Obec" : "MČ/MO"}
            </td>
            <td className="p-2">{founder.schoolCount}</td>
            <td className="p-2">
              <div className="inline-block bg-emerald-500 text-white font-bold px-2 rounded-full text-sm">
                Aktuální
              </div>
            </td>
            <td className="p-2">
              upravit vyhlášku | mapa | detail
              </td>
          </tr>
        ))}
        </tbody>
      </table> */}
    </>
  );
}
