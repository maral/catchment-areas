import { headers } from "next/headers";

export function isPrefetch(): boolean {
  const headersInstance = headers();
  const authorization = headersInstance.get("Next-Router-Prefetch");
  return authorization !== null && authorization === "1";
}
