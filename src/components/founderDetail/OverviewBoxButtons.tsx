"use client";

import {
  City,
  CityStatus,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { SchoolType, getRootPathBySchoolType } from "@/entities/School";
import { Colors } from "@/styles/Themes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { Button } from "@tremor/react";
import { useState } from "react";
import { remult } from "remult";
import LinkButton from "../buttons/LinkButton";

export default function OverviewBoxButtons({
  city,
  fetchCity,
  activeOrdinanceId,
  urlFrom,
  schoolType,
}: {
  city: City;
  fetchCity: () => Promise<void>;
  activeOrdinanceId?: number;
  urlFrom?: string[];
  schoolType: SchoolType;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const statusParam = getStatusPropertyBySchoolType(schoolType);

  const rootPath = getRootPathBySchoolType(schoolType);

  const setAsPublished = async () => {
    setLoading(true);

    await remult
      .repo(City)
      .save({ ...city, [statusParam]: CityStatus.Published });
    await fetchCity();
    setLoading(false);
  };

  const setAsInProgress = async () => {
    setLoading(true);

    await remult
      .repo(City)
      .save({ ...city, [statusParam]: CityStatus.InProgress });
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
          onClick={setAsInProgress}
        >
          {texts.setAsInProgress}
        </Button>
      ) : (
        <Button
          className="my-2 w-full"
          color={Colors.Primary}
          variant="secondary"
          loading={loading}
          onClick={setAsPublished}
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
