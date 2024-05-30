import { User } from "@/entities/User";
import { Role } from "@/utils/shared/permissions";
import { getNotLoggedInResponse, isLoggedAsAdmin } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { remult } from "remult";
import { api } from "../../../[...remult]/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isLoggedAsAdmin())) {
    return getNotLoggedInResponse();
  }

  const user = await api.withRemult(
    async () => await remult.repo(User).findId(params.id)
  );

  if (!user) {
    return NextResponse.json(
      {
        error: "User not found",
      },
      { status: 404 }
    );
  }

  const data = await req.formData();
  const name = data.get("name") as string;
  const futureEmail =
    user.email.length > 0 ? "" : (data.get("futureEmail") as string);
  const role = data.get("role") as Role;

  await api.withRemult(
    async () =>
      await remult.repo(User).save({
        ...user,
        name,
        futureEmail,
        role,
      })
  );

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 }
  );
}
