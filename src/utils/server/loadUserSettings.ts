import { api } from "@/app/api/[...remult]/api";
import { getServerSessionWithOptions } from "@/app/api/auth/[...nextauth]/config";
import { UserSettings } from "@/entities/UserSettings";
import { remult } from "remult";

export const getUserSettings = async (key: keyof UserSettings) => {
  // const userId = (await getServerSessionWithOptions())?.user.id ?? '';
  const userId = '1';
    
  const userSettings = await api.withRemult(async () => {
    return await remult.repo(UserSettings).findFirst({
      user: { $id: userId }
    });
  });
  if (userSettings && userSettings[key]) {
    return userSettings[key];
  }
  return null;
};
