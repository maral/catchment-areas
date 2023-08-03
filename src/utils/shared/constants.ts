import {
  OpenDataSyncOptions,
  OpenDataSyncOptionsPartial,
} from "text-to-map/dist/utils/helpers";

const constants = {
  localStorageKey: {
    isNavbarOpen: "isNavbarOpen",
  },
};

export const routes = {
  founders: '/founders',
  regions: '/regions',
  counties: '/counties',
  orps: '/orps',
  users: '/users',
  detail: '/detail',
  addOrdinance: '/add-ordinance',
  editOrdinance: '/edit-ordinance',
  map: '/',
  download: '/download',
  new: '/new',
};

export const modules = {
  founders: 'founders',
  regions: 'regions',
  counties: 'counties',
  orps: 'orps',
  users: 'users',
};

export const textToMapOptions: OpenDataSyncOptionsPartial = {
  dataDir: "./data",
};

export default constants;
