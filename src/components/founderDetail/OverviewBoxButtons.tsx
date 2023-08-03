"use client";

import { Colors } from "@/styles/Themes";
import { texts } from "@/utils/shared/texts";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import {
  MapPinIcon,
  PencilSquareIcon
} from "@heroicons/react/24/solid";
import LinkButton from "../buttons/LinkButton";
import { routes } from "@/utils/shared/constants";
import { Founder, FounderStatus } from "@/entities/Founder";
import { Button } from "@tremor/react";
import { remult } from "remult";
import { useState } from "react";

export default function OverviewBoxButtons({
  founder,
  fetchFounder,
  activeOrdinanceId,
  urlFrom,
}: {
  founder: Founder;
  fetchFounder: () => Promise<void>;
  activeOrdinanceId?: number;
  urlFrom?: string[];
}) {
  const [loading, setLoading] = useState<boolean>(false);

  const setAsPublished = async () => {
    setLoading(true);
    await remult.repo(Founder).save({ ...founder, status: FounderStatus.Published });
    await fetchFounder();
    setLoading(false);
  }

  const setAsInProgress = async () => {
    setLoading(true);
    await remult.repo(Founder).save({ ...founder, status: FounderStatus.InProgress });
    await fetchFounder();
    setLoading(false);
  }

  return (
    <>
      {founder.status == FounderStatus.Published
        ? (
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
            disabled={founder.status != FounderStatus.InProgress}
            onClick={async () => await setAsPublished()}
          >
            {texts.setAsPublished}
          </Button>
        )
      }
      <LinkButton
        href={(urlFrom && urlFrom.length >= 2)
          ? `${routes.founders}/${founder.id}${routes.editOrdinance}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
          : `${routes.founders}/${founder.id}${routes.editOrdinance}/${activeOrdinanceId}`
        }
        buttonProps={{
          icon: PencilSquareIcon,
          color: Colors.Secondary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
      >
        {texts.editOrdinanceText}
      </LinkButton>
      <LinkButton
        href={(urlFrom && urlFrom.length >= 2)
          ? `${routes.founders}/${founder.id}${routes.map}/${urlFrom[0]}/${urlFrom[1]}/${activeOrdinanceId}`
          : `${routes.founders}/${founder.id}${routes.map}/${activeOrdinanceId}`}
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
        href={`${routes.founders}/${founder.id}${routes.download}/${activeOrdinanceId}`}
        buttonProps={{
          icon: ArrowDownTrayIcon,
          variant: "secondary",
          color: Colors.Secondary,
          className: "my-2 w-full",
          disabled: !activeOrdinanceId,
        }}
        target={!activeOrdinanceId ? '_self' : '_blank'}
      >
        {texts.downloadJson}
      </LinkButton>
    </>
  );
}
