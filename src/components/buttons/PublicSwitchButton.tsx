"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { SchoolType } from "@/types/basicTypes";
import { AcademicCapIcon, PuzzlePieceIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { texts } from "@/utils/shared/texts";
import { SwitchButton } from "@/components/buttons/SwitchButton";

export function PublicSwitchButton() {
  const router = useRouter();
  const onValueChange = (value: SchoolType) => {
    const paramVal = value === SchoolType.Kindergarten ? "ms" : "zs";
    router.push(`?type=${paramVal}`);
  };

  return (
    <SwitchButton
      segments={[
        {
          label: texts.schoolsKindergarten,
          icon: PuzzlePieceIcon,
          value: SchoolType.Kindergarten,
        },
        {
          label: texts.schoolsElementary,
          icon: AcademicCapIcon,
          value: SchoolType.Elementary,
        },
      ]}
      defaultValue={SchoolType.Elementary}
      onValueChange={onValueChange}
    />
  );
}
