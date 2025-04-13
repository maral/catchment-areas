import Link from "next/link";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="">
        <h1 className="text-6xl text-gray-700 text-center">404</h1>
        <p className="text-gray-500 text-center mt-4">
          Tato stránka si s námi hraje na schovávanou. A vyhrává.
        </p>
        <div className="mt-12 mb-40 text-center">
          <Button variant={"default"} asChild>
            <Link href="/">Zpět na hlavní mapu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
