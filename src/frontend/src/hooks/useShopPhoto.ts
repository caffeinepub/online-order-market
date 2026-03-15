import { useCallback, useState } from "react";
import { useShopSocials } from "./useShopSocials";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useShopPhoto(principalId: string | undefined): string | null {
  const socials = useShopSocials(principalId || "");
  if (socials.photoUrl) return socials.photoUrl;
  if (!principalId) return null;
  try {
    return localStorage.getItem(`shopPhoto_${principalId}`) ?? null;
  } catch {
    return null;
  }
}

export function useShopPhotoReactive(
  principalId: string | undefined,
): string | null {
  return useShopPhoto(principalId);
}

export function useUploadShopPhoto() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhoto = useCallback(
    async (principalId: string, file: File): Promise<string> => {
      setIsUploading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        localStorage.setItem(`shopPhoto_${principalId}`, dataUrl);
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: `shopPhoto_${principalId}`,
            newValue: dataUrl,
          }),
        );
        return dataUrl;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { uploadPhoto, isUploading };
}
