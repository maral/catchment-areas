"use client";

import { City, CityStatus } from "@/entities/City";
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { MapPinIcon, PencilSquareIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react";
import { useState } from "react";
import { remult } from "remult";
import LinkButton from "../buttons/LinkButton";
import { SchoolTypeValues, getSchoolTypeCode } from "@/entities/School";
import { getStatusPropertyBySchoolType } from "@/entities/City";

export default function OverviewBoxButtons({
  city,
  fetchCity,
  activeOrdinanceId,
  urlFrom,
  rootPath,
  schoolType,
}: {
  city: City;
  fetchCity: () => Promise<void>;
  activeOrdinanceId?: number;
  urlFrom?: string[];
  rootPath: string;
  schoolType: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const schoolTypeCode = getSchoolTypeCode(schoolType);
  const statusParam = getStatusPropertyBySchoolType(schoolTypeCode);

  const setAsPublished = async () => {
    setLoading(true);

    let statusObject: {
      [key: string]: CityStatus;
    } = {};

    statusObject[statusParam] = CityStatus.Published;

    await remult.repo(City).save({ ...city, ...statusObject });
    await fetchCity();
    setLoading(false);
  };

  const setAsInProgress = async () => {
    setLoading(true);
    let statusObject: {
      [key: string]: CityStatus;
    } = {};

    statusObject[statusParam] = CityStatus.InProgress;

    await remult.repo(City).save({ ...city, ...statusObject });
    await fetchCity();
    setLoading(false);
  };

  return (
    <>
      {city[statusParam] == CityStatus.Published ? (
        <Button
          className="my-2 w-full"
          color={Colors.Secondary}
          variant="secondary"
          loading={loading}
          onClick={async () => await setAsInProgress()}
        >
          {texts.setAsInProgress}
        </Button>
      ) : (
        <Button
          className="my-2 w-full"
          color={Colors.Primary}
          variant="secondary"
          loading={loading}
          disabled={city[statusParam] != CityStatus.InProgress}
          onClick={async () => await setAsPublished()}
        >
          {texts.setAsPublished}
        </Button>
      )}
      <LinkButton
        href={
          urlFrom && urlFrom.length >= 2
            ? `${rootPath}/${city.code}${routes.map}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
            : `${rootPath}/${city.code}${routes.map}/${activeOrdinanceId}`
        }
        buttonProps={{
          icon: MapPinIcon,
          color: Colors.Primary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
      >
        {texts.viewOnMap}
      </LinkButton>
      <LinkButton
        href={`${rootPath}/${city.code}${routes.download}/${activeOrdinanceId}`}
        buttonProps={{
          icon: ArrowDownTrayIcon,
          variant: "secondary",
          color: Colors.Secondary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
        target={!activeOrdinanceId ? "_self" : "_blank"}
      >
        {texts.downloadJson}
      </LinkButton>
    </>
  );
}
