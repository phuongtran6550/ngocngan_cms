export const brand = {
  name: "Ngọc Châu",
  cmsName: "Ngọc Châu CMS",
  tagline: "Thủ đầu một",
  favicon: "/brand/favicon.ico",
  appleTouchIcon: "/brand/ngoc-chau-favicon-180.png",
  themeColor: "#67131d",
  assets: {
    mark: {
      gold: "/brand/ngoc-chau-mark-gold.png",
      black: "/brand/ngoc-chau-mark-black.png",
      white: "/brand/ngoc-chau-mark-white.png",
      goldOnBurgundy: "/brand/ngoc-chau-mark-gold-on-burgundy.png",
    },
    wordmark: {
      gold: "/brand/ngoc-chau-wordmark-gold.png",
      black: "/brand/ngoc-chau-wordmark-black.png",
      white: "/brand/ngoc-chau-wordmark-white.png",
      goldOnBurgundy: "/brand/ngoc-chau-wordmark-gold-on-burgundy.png",
    },
    lockup: {
      gold: "/brand/ngoc-chau-lockup-gold.png",
      black: "/brand/ngoc-chau-lockup-black.png",
      white: "/brand/ngoc-chau-lockup-white.png",
      goldOnBurgundy: "/brand/ngoc-chau-lockup-gold-on-burgundy.png",
    },
  },
} as const;

export type BrandLogoKind = keyof typeof brand.assets;
export type BrandLogoTone = keyof (typeof brand.assets)[BrandLogoKind];

export function brandAsset(kind: BrandLogoKind, tone: BrandLogoTone = "gold"): string {
  return brand.assets[kind][tone];
}

export function brandPageTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} · ${brand.cmsName}` : brand.cmsName;
}
