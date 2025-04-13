"use client";

import {
  City,
  CityStatus,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { getRootPathBySchoolType } from "@/entities/School";
import { Colors } from "@/styles/Themes";
import { SchoolType } from "@/types/basicTypes";
import { routes } from "@/utils/shared/constants";
import { texts } from "@/utils/shared/texts";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { MapPinIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { remult } from "remult";
import LinkButton from "../buttons/LinkButton";
import { Button } from "../ui/button";

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
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
      >
        <MapPinIcon />
        {texts.viewOnMap}
      </LinkButton>
      <LinkButton
        href={`${rootPath}/${city.code}${routes.download}/${activeOrdinanceId}`}
        buttonProps={{
          variant: "secondary",
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
        target={!activeOrdinanceId ? "_self" : "_blank"}
      >
        <ArrowDownTrayIcon />
        {texts.downloadJson}
      </LinkButton>
    </>
  );
}
