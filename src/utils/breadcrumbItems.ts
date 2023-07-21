import { api } from "@/app/api/[...remult]/api";
import { County } from "@/entities/County";
import { Founder } from "@/entities/Founder";
import { Orp } from "@/entities/Orp";
import { Region } from "@/entities/Region";
import { User } from "@/entities/User";
import { texts } from "@/utils/shared/texts";
import { remult } from "remult";
import { modules, routes } from "./shared/constants";

export type BreadcrumbItem = {
  href: string;
  title: string;
};

export type BreadcrumbItemFunction = (
  ...args: any[]
) => Promise<BreadcrumbItem>;

const foundersRepo = remult.repo(Founder);
const regionsRepo = remult.repo(Region);
const countiesRepo = remult.repo(County);
const orpsRepo = remult.repo(Orp);
const usersRepo = remult.repo(User);

// FOUNDERS
export const foundersBreadcrumb: BreadcrumbItem = {
  href: routes.founders,
  title: texts.founders,
};

export const founderDetailBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string,
  from?: string[]
) => {
  const founder = await api.withRemult(() =>
    foundersRepo.findId(Number(founderId))
  );
  return {
    href: (from && from.length >= 2)
      ? `${routes.founders}/${founderId}${routes.detail}/${from[0]}/${from[1]}`
      : `${routes.founders}/${founderId}${routes.detail}`,
    title: founder?.name,
  };
};

export const addOrdinanceBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string,
  from?: string[]
) => {
  return {
    href: (from && from.length >= 2)
      ? `${routes.founders}/${founderId}${routes.addOrdinance}/${from[0]}/${from[1]}`
      : `${routes.founders}/${founderId}${routes.addOrdinance}`,
    title: texts.addOrdinance,
  };
};

export const editOrdinanceBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string
) => {
  return {
    href: `${routes.founders}/${founderId}${routes.editOrdinance}`,
    title: texts.editOrdinance,
  };
};

export const mapBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string,
  ordinanceId?: string
) => {
  return {
    href: `${routes.founders}/${founderId}${routes.map}${ordinanceId ? `/${ordinanceId}` : ""}`,
    title: texts.map,
  };
};

// REGIONS
export const regionsBreadcrumb: BreadcrumbItem = {
  href: routes.regions,
  title: texts.regions,
}

export const regionDetailBreadcrumb: BreadcrumbItemFunction = async (regionCode: string) => {
  const region = await api.withRemult(() => regionsRepo.findId(regionCode));
  return {
    href: `${routes.regions}/${regionCode}`,
    title: region?.name,
  }
}

// COUNTIES
export const countiesBreadcrumb: BreadcrumbItem = {
  href: routes.counties,
  title: texts.counties,
}

export const countyDetailBreadcrumb: BreadcrumbItemFunction = async (countyCode: string) => {
  const county = await api.withRemult(() => countiesRepo.findId(countyCode));
  return {
    href: `${routes.counties}/${countyCode}`,
    title: county?.name,
  }
}

// ORPS
export const orpsBreadcrumb: BreadcrumbItem = {
  href: routes.orps,
  title: texts.orp,
}

export const orpDetailBreadcrumb: BreadcrumbItemFunction = async (orpCode: string) => {
  const orp = await api.withRemult(() => orpsRepo.findId(orpCode));
  return {
    href: `${routes.orps}/${orpCode}`,
    title: orp?.name,
  }
}

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
export const founderFromBreadcrumb: (
  from?: string[]
) => Promise<BreadcrumbItem[]> = async (
  from,
) => {
  const breadcrumbItems: BreadcrumbItem[] = [];
  if (from && from.length >= 2) {
    if (from[0] === modules.regions) {
      const regionsBreadcrumbs = await Promise.all([
        regionsBreadcrumb,
        regionDetailBreadcrumb(from[1]),
      ]);
      breadcrumbItems.push(...regionsBreadcrumbs)
    } else if (from[0] === modules.counties) {
      const countiesBreadcrumbs = await Promise.all([
        countiesBreadcrumb,
        countyDetailBreadcrumb(from[1]),
      ]);
      breadcrumbItems.push(...countiesBreadcrumbs)
    } else if (from[0] === modules.orps) {
      const orpsBreadcrumbs = await Promise.all([
        orpsBreadcrumb,
        orpDetailBreadcrumb(from[1]),
      ]);
      breadcrumbItems.push(...orpsBreadcrumbs)
    }
  } else {
    breadcrumbItems.push(foundersBreadcrumb);
  }
  return breadcrumbItems;
};

export const getOrdinanceIdFromFrom: (from?: string[]) => string | undefined = (from) => {
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
