import { remult } from "remult";
import { Founder } from "@/entities/Founder";
import { texts } from "./texts";
import { api } from "@/app/api/[...remult]/route";

export type BreadcrumbItem = {
  href: string;
  title: string;
};


export const foundersBreadcrumb = {
  href: "/founders",
  title: texts.founders,
}

export const founderDetailBreadcrumb = async (founderId: string) => {
  
  const foundersRepo = remult.repo(Founder);
  const founder = await api.withRemult(() => foundersRepo.findId(Number(founderId)));
  return {
    href: `/founders/${founderId}`,
    title: founder.name,
  }
}

export const addOrdinanceBreadcrumb = async (founderId: string) => {
  return {
    href: `/founders/${founderId}/add-ordinance`,
    title: texts.addOrdinance,
  }
}