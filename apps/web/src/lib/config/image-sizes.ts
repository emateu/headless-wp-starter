export const imageSizes = {
  hero: {
    desktop: { width: 1200, height: 675, aspect: "16/9" },
    mobile: { width: 768, height: 512, aspect: "3/2" },
    sizes: "(max-width: 768px) 100vw, 66vw",
  },
  card: {
    desktop: { width: 600, height: 338, aspect: "16/9" },
    mobile: { width: 384, height: 256, aspect: "3/2" },
    sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
  },
  thumbnail: {
    desktop: { width: 150, height: 150, aspect: "1/1" },
    mobile: { width: 150, height: 150, aspect: "1/1" },
    sizes: "150px",
  },
  articleBody: {
    desktop: { width: 800, height: 450, aspect: "16/9" },
    mobile: { width: 768, height: 512, aspect: "3/2" },
    sizes: "(max-width: 768px) 100vw, 800px",
  },
  gallery: {
    desktop: { width: 400, height: 400, aspect: "1/1" },
    mobile: { width: 300, height: 300, aspect: "1/1" },
    sizes: "(max-width: 768px) 50vw, 25vw",
  },
} as const;

export type ImageSizeVariant = keyof typeof imageSizes;
