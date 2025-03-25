import { api } from "@/app/api/[...remult]/api";
import { Region } from "@/entities/Region";
import { User } from "@/entities/User";
import { texts } from "@/utils/shared/texts";
import { remult } from "remult";
import { City } from "../entities/City";
import { Founder } from "../entities/Founder";
import { Ordinance } from "../entities/Ordinance";
import { modules, routes } from "./shared/constants";
import { getRootPathBySchoolType, SchoolType } from "@/entities/School";

export type BreadcrumbItem = {
  href: string;
  title: string;
};

export type BreadcrumbItemFunction = (
  ...args: any[]
) => Promise<BreadcrumbItem>;

const citiesRepo = remult.repo(City);
const regionsRepo = remult.repo(Region);
const usersRepo = remult.repo(User);

// CITIES
export const citiesBreadcrumb: BreadcrumbItem = {
  href: routes.cities,
  title: texts.cities,
};

export const schoolTypeBreadcrumb: BreadcrumbItemFunction = async (
  type: SchoolType
) => {
  if (type === SchoolType.Kindergarten) {
    return {
      href: `${routes.kindergarten}`,
      title: texts.schoolsKindergarten,
    };
  }

  return {
    href: `${routes.elementary}`,
    title: texts.schoolsElementary,
  };
};

export const cityDetailBreadcrumb: BreadcrumbItemFunction = async (
  cityCode: string,
  schoolType: SchoolType,
  from?: string[]
) => {
  const city = await api.withRemult(() =>
    citiesRepo.findFirst({ code: Number(cityCode) })
  );

  const rootPath = getRootPathBySchoolType(schoolType);

  return {
    href:
      from && from.length >= 2
        ? `${rootPath}/${cityCode}${routes.detail}/${from[0]}/${from[1]}`
        : `${rootPath}/${cityCode}${routes.detail}`,
    title: city?.name,
  };
};

export const addOrdinanceBreadcrumb: BreadcrumbItemFunction = async (
  cityCode: string,
  schoolType: SchoolType,
  from?: string[]
) => {
  const rootPath = getRootPathBySchoolType(schoolType);

  return {
    href:
      from && from.length >= 2
        ? `${rootPath}/${cityCode}${routes.addOrdinance}/${from[0]}/${from[1]}`
        : `${rootPath}/${cityCode}${routes.addOrdinance}`,
    title: texts.addOrdinance,
  };
};

export const editOrdinanceBreadcrumb = async (
  cityCode: number,
  founderId: number,
  ordinanceId: number,
  schoolType: SchoolType
) => {
  const founder = await api.withRemult(() =>
    remult.repo(Founder).findId(founderId)
  );
  const ordinance = await api.withRemult(() =>
    remult.repo(Ordinance).findId(ordinanceId)
  );

  return {
    href: `${getRootPathBySchoolType(schoolType)}/${cityCode}${
      routes.editOrdinance
    }/${founderId}/${ordinanceId}`,
    title: `${texts.editOrdinance} - ${founder.shortName} (${ordinance.number})`,
  };
};

export const mapBreadcrumb: BreadcrumbItemFunction = async (
  cityCode: string,
  ordinanceId: string,
  schoolType: SchoolType
) => {
  return {
    href: `${getRootPathBySchoolType(schoolType)}/${cityCode}${
      routes.map
    }/${ordinanceId}`,
    title: texts.map,
  };
};

export const founderMapBreadcrumb = async (
  cityCode: string,
  ordinanceId: string,
  schoolType: SchoolType
) => {
  return {
    href: `${getRootPathBySchoolType(schoolType)}/${cityCode}${
      routes.map
    }/${ordinanceId}`,
    title: texts.map,
  };
};

// REGIONS
export const regionsBreadcrumb: BreadcrumbItem = {
  href: routes.regions,
  title: texts.regions,
};

export const regionDetailBreadcrumb: BreadcrumbItemFunction = async (
  regionCode: string
) => {
  const region = await api.withRemult(() => regionsRepo.findId(regionCode));
  return {
    href: `${routes.regions}/${regionCode}`,
    title: region?.name,
  };
};

// USERS
export const usersBreadcrumb: BreadcrumbItem = {
  href: routes.users,
  title: texts.users,
};

export const userDetailBreadcrumb: BreadcrumbItemFunction = async (
  userId: string
) => {
  const user = await api.withRemult(() => usersRepo.findId(userId));
  return {
    href: `${routes.users}/${userId}`,
    title: user?.name || user?.email,
  };
};

export const addUserBreadcrumb: BreadcrumbItem = {
  href: `${routes.users}${routes.new}}`,
  title: texts.addUser,
};

// HELPER FUNCTIONS
export const cityFromBreadcrumb = async (type: string, from?: string[]) => {
  const breadcrumbItems: BreadcrumbItem[] = [];
  if (from && from.length >= 2) {
    if (from[0] === modules.regions) {
      const regionsBreadcrumbs = await Promise.all([
        regionsBreadcrumb,
        regionDetailBreadcrumb(from[1]),
      ]);
      breadcrumbItems.push(...regionsBreadcrumbs);
    }
  } else {
    breadcrumbItems.push(await schoolTypeBreadcrumb(type));
  }
  return breadcrumbItems;
};

export const getOrdinanceIdFromFrom: (from?: string[]) => string | undefined = (
  from
) => {
  let ordinanceId: string | undefined;
  if (from) {
    if (from.length === 1) {
      ordinanceId = from[0];
    } else if (from.length >= 3) {
      ordinanceId = from[2];
    }
  }
  return ordinanceId;
};
