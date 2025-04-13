"use client";

import LinkButton from "@/components/buttons/LinkButton";
import { getRootPathBySchoolType } from "@/entities/School";
import { SchoolType } from "@/types/basicTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { PlusIcon } from "@heroicons/react/24/solid";
import HeaderBox from "../common/HeaderBox";

export default function OrdinanceHeader({
  cityCode,
  urlFrom,
  schoolType,
}: {
  cityCode: string;
  urlFrom?: string[];
  schoolType: SchoolType;
}) {
  const rootPath = getRootPathBySchoolType(schoolType);

  return (
    <HeaderBox title={texts.ordinances}>
      <LinkButton
        href={
          urlFrom && urlFrom.length >= 2
            ? `${rootPath}/${cityCode}${routes.addOrdinance}/${urlFrom[0]}/${urlFrom[1]}`
            : `${rootPath}/${cityCode}${routes.addOrdinance}`
        }
      >
        <PlusIcon />
        {texts.addOrdinance}
      </LinkButton>
    </HeaderBox>
  );
}
