import { Founder } from "@/entities/Founder";
import LinkButton from "../buttons/LinkButton";
import { texts } from "@/utils/shared/texts";
import { MapIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Colors } from "@/styles/Themes";
import { Button } from "@tremor/react";


export default function TableActionButtons({
  item,
}: {
  item: Founder;
}) {
  return (
    <div className="flex">
      <LinkButton
        className="mr-2"
        href={`/founders/${item.id}/map`}
        prefetch={false}
        buttonProps={{
          icon: MapIcon,
          color: Colors.Primary
        }}
      >
        {texts.map}
      </LinkButton>
      <Button
        color={Colors.Secondary}
        icon={PencilSquareIcon}
        onClick={() => {
          console.log("redirect to this url:", `/founders/${item.id}/fetchCurrentOrdinanceId`);
        }}
      >
        {texts.editOrdinance}
      </Button>
    </div>
  );
}