import { headers } from "next/headers";

export async function isPrefetch(): Promise<boolean> {
  const headersInstance = await headers();
  const authorization = headersInstance.get("Next-Router-Prefetch");
  return authorization !== null && authorization === "1";
}
