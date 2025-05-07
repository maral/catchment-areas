import { OpenDataSyncOptionsPartial } from "text-to-map/dist/utils/helpers";

const constants = {
  localStorageKey: {
    isNavbarOpen: "isNavbarOpen",
  },
};

export const routes = {
  cities: "/cities",
  kindergarten: "/admin/kindergarten",
  elementary: "/admin/elementary",
  shortElementary: "/zs",
  shortKindergarten: "/ms",
  regions: "/regions",
  users: "/admin/users",
  detail: "/detail",
  addOrdinance: "/add-ordinance",
  editOrdinance: "/edit-ordinance",
  map: "/map",
  home: "/",
  download: "/download",
  new: "/new",
  signIn: "/admin/auth/signin",
};

export const textToMapOptions: OpenDataSyncOptionsPartial = {
  dataDir: "./data",
};

export default constants;
