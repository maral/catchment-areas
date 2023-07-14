import { getRemultAPI } from "./config";

export const api = getRemultAPI();

export const { GET, POST, PUT, DELETE } = api;
