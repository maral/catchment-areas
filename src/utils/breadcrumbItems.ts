import { api } from "@/app/api/[...remult]/api";
import { Founder } from "@/entities/Founder";
import { Orp } from "@/entities/Orp";
import { Region } from "@/entities/Region";
import { User } from "@/entities/User";
import { texts } from "@/utils/shared/texts";
import { remult } from "remult";

export type BreadcrumbItem = {
  href: string;
  title: string;
};

export type BreadcrumbItemFunction = (
  ...args: any[]
) => Promise<BreadcrumbItem>;

const foundersRepo = remult.repo(Founder);
const regionsRepo = remult.repo(Region);
const orpsRepo = remult.repo(Orp);
const usersRepo = remult.repo(User);

// FOUNDERS
export const foundersBreadcrumb: BreadcrumbItem = {
  href: "/founders",
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
      ? `/founders/${founderId}/detail/${from[0]}/${from[1]}`
      : `/founders/${founderId}/detail`,
    title: founder?.name,
  };
};

export const addOrdinanceBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string,
  from?: string[]
) => {
  return {
    href: (from && from.length >= 2)
      ? `/founders/${founderId}/add-ordinance/${from[0]}/${from[1]}`
      : `/founders/${founderId}/add-ordinance`,
    title: texts.addOrdinance,
  };
};

export const editOrdinanceBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string
) => {
  return {
    href: `/founders/${founderId}/edit-ordinance`,
    title: texts.editOrdinance,
  };
};

export const mapBreadcrumb: BreadcrumbItemFunction = async (
  founderId: string,
  ordinanceId?: string
) => {
  return {
    href: `/founders/${founderId}/map${ordinanceId ? `/${ordinanceId}` : ""}`,
    title: texts.map,
  };
};

// REGIONS
export const regionsBreadcrumb: BreadcrumbItem = {
  href: "/regions",
  title: texts.regions,
}

export const regionDetailBreadcrumb: BreadcrumbItemFunction = async (regionCode: string) => {
  const region = await api.withRemult(() => regionsRepo.findId(regionCode));
  return {
    href: `/regions/${regionCode}`,
    title: region?.name,
  }
}

export const regionFounderDetailBreadcrumb: BreadcrumbItemFunction = async ({
  regionCode,
  founderId,
}) => {
  const founder = await api.withRemult(() => foundersRepo.findId(Number(founderId)));
  return {
    href: `/regions/${regionCode}/${founderId}`,
    title: founder?.name,
  }
}

// ORPS
export const orpsBreadcrumb: BreadcrumbItem = {
  href: "/orps",
  title: texts.orp,
}

export const orpDetailBreadcrumb: BreadcrumbItemFunction = async (orpCode: string) => {
  const orp = await api.withRemult(() => orpsRepo.findId(orpCode));
  return {
    href: `/orps/${orpCode}`,
    title: orp?.name,
  }
}

// USERS
export const usersBreadcrumb: BreadcrumbItem = {
  href: "/users",
  title: texts.users,
};

export const userDetailBreadcrumb: BreadcrumbItemFunction = async (
  userId: string
) => {
  const user = await api.withRemult(() => usersRepo.findId(userId));
  return {
    href: `/users/${userId}`,
    title: user?.name || user?.email,
  };
};

export const addUserBreadcrumb: BreadcrumbItem = {
  href: `/users/new`,
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
    if (from[0] === 'regions') {
      const regionsBreadcrumbs = await Promise.all([
        regionsBreadcrumb,
        regionDetailBreadcrumb(from[1]),
      ]);
      breadcrumbItems.push(...regionsBreadcrumbs)
    } else if (from[0] === 'orps') {
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
