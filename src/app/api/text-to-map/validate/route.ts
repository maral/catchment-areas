import { TextToMapError } from "@/utils/types";
import { NextRequest, NextResponse } from "next/server";
import {
  ErrorCallbackParams,
  parseOrdinanceToAddressPoints,
} from "text-to-map";

export async function POST(request: NextRequest) {
  const { lines } = await request.json();
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

  parseOrdinanceToAddressPoints(lines, {}, onError, onWarning);

  return NextResponse.json({
    errors: errorList,
    warnings: warningList,
  });
}
