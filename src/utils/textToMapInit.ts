import { TextToMapController } from "@/controllers/TextToMapController";
import { parseOrdinanceToAddressPoints } from "text-to-map";
import { ErrorCallbackParams } from "./types";
import { textToMapOptions } from "./constants";

TextToMapController._parseOrdinance = (
  lines: string[],
  onError: (params: ErrorCallbackParams) => void,
  onWarning: (params: ErrorCallbackParams) => void
) =>
  parseOrdinanceToAddressPoints(
    lines,
    textToMapOptions,
    {},
    onError,
    onWarning
  );
