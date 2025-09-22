import { api } from "@/app/api/[...remult]/api";
import { getRootPathBySchoolType } from "@/entities/School";
import { User } from "@/entities/User";
import { SchoolType } from "@/types/basicTypes";
import { texts } from "@/utils/shared/texts";
import { remult } from "remult";
import { City } from "../entities/City";
import { Founder } from "../entities/Founder";
import { Ordinance } from "../entities/Ordinance";
import { routes } from "./shared/constants";

export type BreadcrumbItem = {
  href: string;
  title: string;
};

export type BreadcrumbItemFunction = (
  ...args: any[]
) => Promise<BreadcrumbItem>;

const citiesRepo = remult.repo(City);
const usersRepo = remult.repo(User);

export const schoolTypeBreadcrumb = (type: SchoolType) => {
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
  schoolType: SchoolType
) => {
  const city = await api.withRemult(() =>
    citiesRepo.findFirst({ code: Number(cityCode) })
  );

  const rootPath = getRootPathBySchoolType(schoolType);

  return {
    href: `${rootPath}/${cityCode}${routes.detail}`,
    title: city?.name,
  };
};

export const addOrdinanceBreadcrumb = (
  cityCode: string,
  schoolType: SchoolType
) => {
  const rootPath = getRootPathBySchoolType(schoolType);

  return {
    href: `${rootPath}/${cityCode}${routes.addOrdinance}`,
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

export const mapBreadcrumb = (
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

export const founderMapBreadcrumb = (
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

// ANALYTICS DATA
export const analyticsBreadcrumb: BreadcrumbItem = {
  href: routes.analytics,
  title: texts.analyticsLayers,
};

export const addAnalyticsDataBreadcrumb: BreadcrumbItem = {
  href: `${routes.analytics}${routes.new}`,
  title: texts.addAnalyticsData,
};
