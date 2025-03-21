"use client";

import { texts } from "@/utils/shared/texts";
import { PlusIcon } from "@heroicons/react/24/solid";
import LinkButton from "@/components/buttons/LinkButton";
import HeaderBox from "../common/HeaderBox";
import { routes } from "@/utils/shared/constants";
import { Colors } from "@/styles/Themes";

export default function OrdinanceHeader({
  cityCode,
  urlFrom,
  schoolType,
}: {
  cityCode: string;
  urlFrom?: string[];
  schoolType: string;
}) {
  const rootPath = routes[schoolType as keyof typeof routes];

  return (
    <div className="flex justify-between mb-2">
      <HeaderBox title={texts.ordinances} />
      <LinkButton
        className="m-2"
        href={
          urlFrom && urlFrom.length >= 2
            ? `${rootPath}/${cityCode}${routes.addOrdinance}/${urlFrom[0]}/${urlFrom[1]}`
            : `${rootPath}/${cityCode}${routes.addOrdinance}`
        }
        buttonProps={{ color: Colors.Primary, icon: PlusIcon }}
      >
        {texts.addOrdinance}
      </LinkButton>
    </div>
  );
}
