import { useEffect, useState } from "react";
import { api } from "@/app/api/[...remult]/api";
import { remult } from "remult";
import { UserSettings } from "@/entities/UserSettings";
import { useSession } from "next-auth/react";

export const useLocalStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      setValue(JSON.parse(value));
    } 
  }, [key]);

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [value, key]);

  return [value, setValue];
};

export const useUserSettings = (key: keyof UserSettings, initialValue: any) => {
  const [value, setValue] = useState(initialValue);
  const userSettingsRepo = remult.repo(UserSettings);
  const session = useSession();
  const userId = session.data?.user.id ?? '';

  useEffect(() => {
    api.withRemult(async () => {
      const userSettings = await userSettingsRepo.findFirst({
        user: { $id: userId }
      })

      if (userSettings && userSettings[key]) {
        setValue(userSettings[key]);
      }
    });
  }, [userId, key, userSettingsRepo]);

  useEffect(() => {
    api.withRemult(async () => {
      const userSettings = await userSettingsRepo.findFirst({
        user: { $id: userId }
      });

      if (userSettings) {
        await userSettingsRepo.save({
          ...userSettings,
          [key]: value
        });
      } else {
        await userSettingsRepo.save({
          [key]: value
        });
      }
    });
  }, [userId, key, value, userSettingsRepo]);

  return [value, setValue];
};
