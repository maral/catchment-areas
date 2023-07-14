import { TextToMapError } from "@/utils/shared/types";
import { NextRequest, NextResponse } from "next/server";
import {
  ErrorCallbackParams,
  getNewMunicipality,
  parseOrdinanceToAddressPoints,
} from "text-to-map";
import { api } from "../../[...remult]/route";
import { remult } from "remult";
import { Founder } from "@/entities/Founder";

export async function POST(request: NextRequest) {
  const { lines, founderId } = await request.json();
  const errorList: TextToMapError[] = [];
  const warningList: TextToMapError[] = [];
  const onError = ({ line, lineNumber, errors }: ErrorCallbackParams) => {
    errors.forEach((error) => {
      errorList.push({ ...error, lineNumber, line });
    });
  };
  const onWarning = ({ line, lineNumber, errors }: ErrorCallbackParams) => {
    errors.forEach((error) => {
      warningList.push({ ...error, lineNumber, line });
    });
  };
  const founder = await api.withRemult(async () => {
    return remult.repo(Founder).findId(founderId);
  });
  const currentMunicipality = await getNewMunicipality(founder.shortName);

  await parseOrdinanceToAddressPoints(
    lines,
    currentMunicipality.errors.length === 0
      ? { currentMunicipality: currentMunicipality.municipality }
      : {},
    onError,
    onWarning
  );

  return NextResponse.json({
    errors: errorList,
    warnings: warningList,
  });
}
