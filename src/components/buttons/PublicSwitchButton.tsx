"use client";

import Spinner from "@/components/common/Spinner";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { SchoolType } from "@/types/basicTypes";
import  SwitchButton  from "@/components/buttons/SwitchButton";
import {
  AcademicCapIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/solid";

export default function PublicSwitchButton() {
  const Btn = useMemo(
    () =>
      dynamic(() => import("@/components/buttons/SwitchButton"), {
        ssr: false,
      }),
    []
  );

  return <Btn leftLabel="Mateřské Školy" leftIcon={PuzzlePieceIcon} rightLabel="Základní Školy" rightIcon={AcademicCapIcon} leftValue={SchoolType.Kindergarten} rightValue={SchoolType.Elementary} />;
}
