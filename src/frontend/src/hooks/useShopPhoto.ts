import { useCallback, useEffect, useState } from "react";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useShopPhoto(principalId: string | undefined) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!principalId) {
      setPhotoUrl(null);
      return;
    }
    const stored = localStorage.getItem(`shopPhoto_${principalId}`);
    setPhotoUrl(stored ?? null);
  }, [principalId]);

  return photoUrl;
}

export function useUploadShopPhoto() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhoto = useCallback(
    async (principalId: string, file: File): Promise<string> => {
      setIsUploading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        localStorage.setItem(`shopPhoto_${principalId}`, dataUrl);
        // Dispatch a storage event so other hooks on the same page can react
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

export function useShopPhotoReactive(principalId: string | undefined) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (!principalId) return null;
    return localStorage.getItem(`shopPhoto_${principalId}`) ?? null;
  });

  useEffect(() => {
    if (!principalId) {
      setPhotoUrl(null);
      return;
    }
    setPhotoUrl(localStorage.getItem(`shopPhoto_${principalId}`) ?? null);

    const handler = (e: StorageEvent) => {
      if (e.key === `shopPhoto_${principalId}`) {
        setPhotoUrl(e.newValue ?? null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [principalId]);

  return photoUrl;
}
