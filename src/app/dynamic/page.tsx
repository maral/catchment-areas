"use client";

import { Founder, FounderType } from "@/entities/Founder";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { remult } from "remult";

const foundersRepo = remult.repo(Founder);
const perPage = 50;

const getData = async (page: number): Promise<Founder[]> => {
  return foundersRepo.find({
    limit: perPage,
    page: page,
    orderBy: { name: "asc" },
    load: (f) => [f.city!],
  });
};

export default function Home() {
  const _page = 1;
  const [founders, setFounders] = useState<Founder[]>([]);
  const [page, setPage] = useState(_page);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const session = useSession();

  useEffect(() => {
    setIsLoading(true);
    getData(page).then((founders) => {
      setFounders(founders);
      setIsLoading(false);
    });
  }, [page]);

  useEffect(() => {
    foundersRepo.count().then(setTotal);
  }, []);

  const lastPage = Math.ceil(total / perPage);

  return (
    <>
      <h1 className="text-4xl text-rose-700 font-bold mb-8">
        Všichni zřizovatelé
      </h1>
      <p className="mb-24">
        Demo, jak používat Remult v Next.js. Dynamicky generované v komponentě.
      </p>
      {founders.length === 0 && (
        <div className="text-center">
          <div className="inline-block text-4xl">Načítáme</div>
        </div>
      )}

      {founders.length > 0 && (
        <>
          <p>
            <button
              className="w-32 bg-sky-700 text-white rounded-full inline-block p-2"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage(page - 1)}
            >
              Předchozí
            </button>
            <span className="mx-8">
              {page} / {lastPage}
            </span>
            <button
              className="w-32 bg-sky-700 text-white rounded-full inline-block p-2"
              disabled={page >= lastPage || isLoading}
              onClick={() => setPage(page + 1)}
            >
              Další
            </button>
          </p>

          <table>
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
                  <td className="text-rose-700 font-bold p-2">
                    {founder.city?.name}
                  </td>

                  <td className="p-2">{founder.city?.region.name}</td>
                  <td className="p-2">{founder.city?.county.name}</td>
                  <td className="p-2">{founder.city?.orp.name}</td>
                  <td className="p-2">
                    {founder.founderType === FounderType.City
                      ? "Obec"
                      : "MČ/MO"}
                  </td>
                  <td className="p-2">{founder.schoolCount}</td>
                  <td className="p-2">
                    <div className="inline-block bg-emerald-500 text-white font-bold px-2 rounded-full text-sm">
                      Aktuální
                    </div>
                  </td>
                  <td className="p-2">upravit vyhlášku | mapa | detail</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
