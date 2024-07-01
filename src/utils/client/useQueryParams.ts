import { PageType, EmbedQueryParams } from "@/types/mapTypes";
import { getDefaultParams } from "@/utils/shared/defaultParams";
import { useSearchParams } from "next/navigation";

const sanitizeColor = (value?: string): string | undefined => {
  if (value && CSS.supports && CSS.supports("color", value)) {
    return value;
  } else if (value && CSS.supports && CSS.supports("color", `#${value}`)) {
    return `#${value}`;
  }
  return undefined;
};

const sanitizeBool = (
  value?: string | boolean,
  defaultValue?: boolean
): boolean => {
  if (typeof value === "boolean") {
    return value;
  } else if (typeof value === "string") {
    if (value === "0" || value === "false") {
      return false;
    } else if (value === "1" || value === "true") {
      return true;
    }
  }
  if (typeof defaultValue === "boolean") {
    return defaultValue;
  }
  return false;
};

const useQueryParams = (type?: PageType): EmbedQueryParams | null => {
  const params = useSearchParams();

  if (!type) {
    return null;
  }
  const defaults = getDefaultParams(type);
  if (!defaults) {
    throw new Error("Invalid page type");
  }

  const color = sanitizeColor(
    params.get("color")?.toString() || defaults.color
  );
  const showSearch = sanitizeBool(
    params.get("search")?.toString(),
    defaults.showSearch
  );
  const showControls = sanitizeBool(
    params.get("controls")?.toString(),
    defaults.showControls
  );

  return {
    ...defaults,
    color,
    showSearch,
    showControls,
  };
};

export default useQueryParams;
