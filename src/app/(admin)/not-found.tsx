import CatchmentLink from "@/components/common/CatchmentLink";
import { routes } from "@/utils/shared/constants";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="">
        <h1 className="text-6xl text-gray-700 text-center">404</h1>
        <p className="text-gray-500 text-center mt-4">
          Tato stránka si s námi hraje na schovávanou. A vyhrává.
        </p>
        <div className="mt-12 mb-40 text-center">
          <CatchmentLink href={routes.elementary}>
            Zpět na seznam zřizovatelů
          </CatchmentLink>
        </div>
      </div>
    </div>
  );
}
