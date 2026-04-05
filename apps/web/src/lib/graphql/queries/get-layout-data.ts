import { cacheLife } from "next/cache";
import type {
  GetMenuByLocationQuery,
  GetMenuByLocationQueryVariables,
  GetSiteSettingsQuery,
  MenuItemFieldsFragment,
} from "../__generated__/graphql";
import {
  GetMenuByLocationDocument,
  GetSiteSettingsDocument,
} from "../__generated__/graphql";
import { graphqlClient } from "../client";

type SiteConfig = NonNullable<
  GetSiteSettingsQuery["siteSettings"]
>["siteConfig"];

export interface LayoutData {
  mainMenu: MenuItemFieldsFragment[];
  footerMenu: MenuItemFieldsFragment[];
  siteSettings: SiteConfig;
}

export async function getLayoutData(): Promise<LayoutData> {
  "use cache";
  cacheLife("static");

  try {
    const [mainMenuData, footerMenuData, settingsData] = await Promise.all([
      graphqlClient.request<
        GetMenuByLocationQuery,
        GetMenuByLocationQueryVariables
      >(GetMenuByLocationDocument, { location: "MAIN" }),
      graphqlClient.request<
        GetMenuByLocationQuery,
        GetMenuByLocationQueryVariables
      >(GetMenuByLocationDocument, { location: "FOOTER" }),
      graphqlClient.request<GetSiteSettingsQuery>(GetSiteSettingsDocument),
    ]);

    return {
      mainMenu: mainMenuData.menuItems?.nodes ?? [],
      footerMenu: footerMenuData.menuItems?.nodes ?? [],
      siteSettings: settingsData.siteSettings?.siteConfig ?? null,
    };
  } catch (error) {
    console.error("[getLayoutData]", error);
    return { mainMenu: [], footerMenu: [], siteSettings: null };
  }
}
