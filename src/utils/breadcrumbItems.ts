import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { User } from "@/entities/User";
import { texts } from "@/utils/shared/texts";
import { api } from "@/app/api/[...remult]/route";
import { Region } from "@/entities/Region";

export type BreadcrumbItem = {
  href: string;
  title: string;
};

export type BreadcrumbItemFunction = (params: any) => Promise<BreadcrumbItem>

const foundersRepo = remult.repo(Founder);
const regionsRepo = remult.repo(Region);
const usersRepo = remult.repo(User);

// FOUNDERS
export const foundersBreadcrumb: BreadcrumbItem = {
  href: "/founders",
  title: texts.founders,
}

export const founderDetailBreadcrumb: BreadcrumbItemFunction = async (founderId: string) => {
  const founder = await api.withRemult(() => foundersRepo.findId(Number(founderId)));
  return {
    href: `/founders/${founderId}`,
    title: founder?.name,
  }
}

export const addOrdinanceBreadcrumb: BreadcrumbItemFunction = async (founderId: string) => {
  return {
    href: `/founders/${founderId}/add-ordinance`,
    title: texts.addOrdinance,
  }
}

export const editOrdinanceBreadcrumb: BreadcrumbItemFunction = async (founderId: string) => {
  return {
    href: `/founders/${founderId}/edit-ordinance`,
    title: texts.editOrdinance,
  }
}

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

// USERS
export const usersBreadcrumb: BreadcrumbItem = {
  href: "/users",
  title: texts.users,
}

export const userDetailBreadcrumb: BreadcrumbItemFunction = async (userId: string) => {
  const user = await api.withRemult(() => usersRepo.findId(userId));
  return {
    href: `/users/${userId}`,
    title: user?.name || user?.email,
  }
}

export const addUserBreadcrumb: BreadcrumbItem = {
  href: `/users/new`,
  title: texts.addUser,
}
