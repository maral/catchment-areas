import { getNotLoggedInResponse, isLoggedAsAdmin } from "@/utils/server/auth";
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/entities/User";
import { Role } from "@/utils/shared/permissions";
import { remult } from "remult";
import { api } from "../../[...remult]/api";
import { texts } from "@/utils/shared/texts";

export async function POST(req: NextRequest) {
  if (!(await isLoggedAsAdmin())) {
    return getNotLoggedInResponse();
  }

  const data = await req.formData();
  const name = data.get("name") as string;
  const futureEmail = data.get("email") as string;
  const role = data.get("role") as Role;

  const exists = await api.withRemult(
    async () =>
      !!(
        (await remult
          .repo(User)
          .findFirst({ email: futureEmail, isDeleted: false })) ||
        (await remult.repo(User).findFirst({ futureEmail }))
      )
  );

  if (exists) {
    return NextResponse.json(
      {
        error: { email: texts.emailAlreadyExists },
      },
      { status: 403 }
    );
  }

  await api.withRemult(async () => {
    const deletedUser = await remult.repo(User).findFirst({
      email: futureEmail,
      isDeleted: true,
    });

    if (deletedUser) {
      await remult.repo(User).update(deletedUser.id, {
        ...deletedUser,
        isDeleted: false,
        name,
        role,
      });
    } else {
      await remult.repo(User).insert({
        name,
        futureEmail,
        role,
      });
    }
  });

  return NextResponse.json(
    {
      success: true,
    },
    { status: 200 }
  );
}
