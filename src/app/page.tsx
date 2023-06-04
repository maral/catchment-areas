import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import Icon from "@/components/icons/Icon";
import { remult } from "remult";
import { County } from "@/entities/County";

// const countiesRepo = remult.repo(County);


export default async function Home() {
  const counties: County[] = [];//await countiesRepo.find();
  return (
    <>
      <h1 className="text-4xl text-rose-700 font-bold mb-8">
        Welcome to the city 17 <Icon icon={faBuilding} />
      </h1>
      <p className="mb-24">
        You&apos;ve chosen or been chosen to relocate to one of our finest remaining
        urban centers.
      </p>

      {counties.map((county) => (
        <div key={county.code}>
          <h2 className="text-2xl text-rose-700 font-bold mb-4">
            {county.name}
          </h2>
          <p className="mb-4">
            Region name:
            {county.region?.name}
          </p>
        </div>
      ))}

      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/IBLWAGS07Vk"
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      ></iframe>
    </>
  );
}
