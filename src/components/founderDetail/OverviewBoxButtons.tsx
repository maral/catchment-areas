"use client";

import {
  City,
  CityStatus,
  getStatusPropertyBySchoolType,
} from "@/entities/City";
import { getRootPathBySchoolType } from "@/entities/School";
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
  schoolType,
}: {
  city: City;
  fetchCity: () => Promise<void>;
  activeOrdinanceId?: number;
  schoolType: SchoolType;
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const statusParam = getStatusPropertyBySchoolType(schoolType);

  const rootPath = getRootPathBySchoolType(schoolType);

  const getSetStatus = (status: CityStatus) => async () => {
    setLoading(true);
    await remult.repo(City).save({ ...city, [statusParam]: status });
    await fetchCity();
    setLoading(false);
  };

  return (
    <>
      {city[statusParam] == CityStatus.Published && (
        <Button
          className="my-2 w-full"
          variant="secondary"
          loading={loading}
          onClick={getSetStatus(CityStatus.InProgress)}
        >
          {texts.setAsInProgress}
        </Button>
      )}
      {city[statusParam] == CityStatus.InProgress && (
        <Button
          className="my-2 w-full"
          loading={loading}
          onClick={getSetStatus(CityStatus.Published)}
        >
          {texts.setAsPublished}
        </Button>
      )}
      {city[statusParam] == CityStatus.NoOrdinance && (
        <Button
          className="my-2 w-full"
          variant="outline"
          loading={loading}
          onClick={getSetStatus(CityStatus.NoExistingOrdinance)}
        >
          {texts.setAsNoExistingOrdinance}
        </Button>
      )}
      {city[statusParam] == CityStatus.NoExistingOrdinance && (
        <Button
          className="my-2 w-full"
          variant="destructive"
          loading={loading}
          onClick={getSetStatus(CityStatus.NoOrdinance)}
        >
          {texts.setAsNoOrdinance}
        </Button>
      )}
      <LinkButton
        href={`${rootPath}/${city.code}${routes.map}/${activeOrdinanceId}`}
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
