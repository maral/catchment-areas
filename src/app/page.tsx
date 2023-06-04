"use client";

import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import Icon from "@/components/icons/Icon";
// import { remult } from "remult";
import { County } from "@/entities/County";
import { useEffect, useState } from "react";

// const countiesRepo = remult.repo(County);

export default async function Home() {
  const [counties, setCounties] = useState([] as County[]);
  useEffect(() => {
    // countiesRepo.find().then((value) => {
    const county = new County();
    county.name = "Praha";
    county.code = 123;
    const value = [county];
    setCounties(value);
    console.log(value);
    // });
  }, []);
  return (
    <>
      <h1 className="text-4xl text-rose-700 font-bold mb-8">
        Welcome to the city 22 <Icon icon={faBuilding} />
      </h1>
      <p className="mb-24">
        You&apos;ve chosen or been chosen to relocate to one of our finest
        remaining urban centers. asdfasd
      </p>

      Length: {counties.length}

      {counties.map((county) => (
        <div key={county.code}>
          <h2 className="text-2xl text-rose-700 font-bold mb-4">
            {county.name}
          </h2>
        </div>
      ))}
    </>
  );
}
