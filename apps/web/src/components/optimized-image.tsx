import Image from "next/image";
import { type ImageSizeVariant, imageSizes } from "~/lib/config/image-sizes";

interface OptimizedImageProps {
  src: string;
  alt: string;
  variant: ImageSizeVariant;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  variant,
  priority = false,
  className,
}: OptimizedImageProps) {
  const size = imageSizes[variant];

  return (
    <Image
      src={src}
      alt={alt}
      width={size.desktop.width}
      height={size.desktop.height}
      sizes={size.sizes}
      priority={priority}
      className={className}
    />
  );
}
