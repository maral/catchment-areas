import { PageType, EmbedQueryParams } from "@/types/mapTypes";

const DEFAULT_QUERY_PARAMS: Map<PageType, EmbedQueryParams> = new Map([
  [
    "city",
    {
      color: undefined,
      showSearch: true,
      showControls: true,
    },
  ],
  [
    "school",
    {
      color: undefined,
      showSearch: false,
      showControls: true,
    },
  ],
]);

export const getDefaultParams = (type: PageType): EmbedQueryParams => {
  const defaults = DEFAULT_QUERY_PARAMS.get(type);
  if (!defaults) {
    throw new Error("Invalid page type");
  }
  return defaults;
};
