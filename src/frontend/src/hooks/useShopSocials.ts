import { useCallback, useEffect, useState } from "react";

export interface ShopSocials {
  facebook: string;
  instagram: string;
  tiktok: string;
}

const DEFAULT_SOCIALS: ShopSocials = {
  facebook: "",
  instagram: "",
  tiktok: "",
};

function getStoredSocials(principalId: string): ShopSocials {
  if (!principalId) return DEFAULT_SOCIALS;
  try {
    const raw = localStorage.getItem(`shopSocials_${principalId}`);
    if (!raw) return DEFAULT_SOCIALS;
    return { ...DEFAULT_SOCIALS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SOCIALS;
  }
}

export function useShopSocials(principalId: string): ShopSocials {
  const [socials, setSocials] = useState<ShopSocials>(() =>
    getStoredSocials(principalId),
  );

  useEffect(() => {
    setSocials(getStoredSocials(principalId));
  }, [principalId]);

  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === `shopSocials_${principalId}`) {
        setSocials(getStoredSocials(principalId));
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [principalId]);

  return socials;
}

export function useSaveShopSocials() {
  const save = useCallback((principalId: string, socials: ShopSocials) => {
    if (!principalId) return;
    localStorage.setItem(`shopSocials_${principalId}`, JSON.stringify(socials));
    // Dispatch storage event for same-tab reactivity
    window.dispatchEvent(
      new StorageEvent("storage", { key: `shopSocials_${principalId}` }),
    );
  }, []);
  return save;
}
