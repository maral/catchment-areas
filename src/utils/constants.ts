import {
  OpenDataSyncOptions,
  OpenDataSyncOptionsPartial,
} from "text-to-map/dist/utils/helpers";

const constants = {
  localStorageKey: {
    isNavbarOpen: "isNavbarOpen",
  },
};

export const textToMapOptions: OpenDataSyncOptionsPartial = {
  dataDir: "./data",
};

export default constants;
