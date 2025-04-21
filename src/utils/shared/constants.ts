import { OpenDataSyncOptionsPartial } from "text-to-map/dist/utils/helpers";

const constants = {
  localStorageKey: {
    isNavbarOpen: "isNavbarOpen",
  },
};

export const routes = {
  cities: "/cities",
  kindergarten: "/kindergarten",
  elementary: "/elementary",
  regions: "/regions",
  users: "/users",
  detail: "/detail",
  addOrdinance: "/add-ordinance",
  editOrdinance: "/edit-ordinance",
  map: "/map",
  publicMap: "/",
  download: "/download",
  new: "/new",
};

export const textToMapOptions: OpenDataSyncOptionsPartial = {
  dataDir: "./data",
};

export default constants;
