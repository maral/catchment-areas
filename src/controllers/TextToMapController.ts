import { ErrorCallbackParams } from "@/utils/types";
import { BackendMethod } from "remult";

interface TextToMapError {
  message: string;
  line: string;
  lineNumber: number;
}

export class TextToMapController {
  @BackendMethod({ allowed: true })
  static async parseOrdinance(
    lines: string[]
  ): Promise<{ errors: TextToMapError[]; warnings: TextToMapError[] }> {
    const errorList: TextToMapError[] = [];
    const warningList: TextToMapError[] = [];
    const onError = ({ line, lineNumber, errors }: ErrorCallbackParams) => {
      errors.forEach((error) => {
        errorList.push({ message: error, lineNumber, line });
      });
    };
    const onWarning = ({ line, lineNumber, errors }: ErrorCallbackParams) => {
      errors.forEach((error) => {
        warningList.push({ message: error, lineNumber, line });
      });
    };

    TextToMapController._parseOrdinance(lines, onError, onWarning);

    return {
      errors: errorList,
      warnings: warningList,
    };
  }

  static _parseOrdinance: (
    lines: string[],
    onError: (params: ErrorCallbackParams) => void,
    onWarning: (params: ErrorCallbackParams) => void
  ) => void;
}
