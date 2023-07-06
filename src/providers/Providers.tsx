"use client";

import { SessionProvider } from "next-auth/react";
import { useState, createContext, useContext } from "react";

export type NavigationContext = {
  navigationItems: NavigationItems;
  setNavigationItems: React.Dispatch<React.SetStateAction<NavigationItems>>;
}

export type NavigationItems = Array<{
  href: string;
  name: string;
}>;

export const NavigationContext = createContext<NavigationContext>({
  navigationItems: [],
  setNavigationItems: () => {}
});

export const useNavigationContext = () => useContext(NavigationContext);

export default function Providers({ children }: { children: React.ReactNode }) {
  const [navigationItems, setNavigationItems] = useState<Array<{
    href: string;
    name: string;
  }>>([]);

  return(
    <SessionProvider>
      <NavigationContext.Provider value={{ navigationItems, setNavigationItems }}>
        {children}
      </NavigationContext.Provider>
    </SessionProvider>
  );
}
