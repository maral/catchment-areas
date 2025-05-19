"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { SchoolType } from "@/types/basicTypes";
import { AcademicCapIcon, PuzzlePieceIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { texts } from "@/utils/shared/texts";

export default function PublicSwitchButton() {
  const router = useRouter();
  const onValueChange = (value: SchoolType) => {
    const paramVal = value === SchoolType.Kindergarten ? "ms" : "zs";
    router.push(`?type=${paramVal}`);
  };

  const Btn = useMemo(
    () =>
      dynamic(() => import("@/components/buttons/SwitchButton"), {
        loading: () => (
          <div
            className={
              "flex justify-center items-center gap-2 py-1 px-2 bg-gray-300 h-[50px] animate-pulse w-[280px] rounded-[6px]"
            }
          ></div>
        ),
        ssr: false,
      }),
    []
  );

  return (
    <Btn
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
