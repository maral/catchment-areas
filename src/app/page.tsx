import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import Icon from "@/components/icons/Icon";

export default function Home() {
  return (
    <>
      <h1 className="text-4xl text-rose-700 font-bold mb-8">
        Welcome to the city 17 <Icon icon={faBuilding} />
      </h1>
      <p className="mb-24">
        You've chosen or been chosen to relocate to one of our finest remaining
        urban centers.
      </p>

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
