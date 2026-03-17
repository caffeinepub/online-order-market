import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { createStorageClient } from "../utils/createStorageClient";
import { convertToJpeg } from "../utils/imageUtils";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";
import { useShopSocials } from "./useShopSocials";

// Returns the photo URL for a shop. Checks backend first (visible to all), then localStorage fallback.
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
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const uploadPhoto = useCallback(
    async (principalId: string, file: File): Promise<string> => {
      setIsUploading(true);
      try {
        // Convert to JPEG for universal device compatibility
        const jpegFile = await convertToJpeg(file, 0.85, 1200, 1200);
        const bytes = new Uint8Array(await jpegFile.arrayBuffer());

        // Upload to blob storage using authenticated identity
        const storageClient = await createStorageClient(identity);
        const { hash } = await storageClient.putFile(bytes);
        const photoUrl = await storageClient.getDirectURL(hash);

        // Get existing socials so we preserve facebook/instagram/tiktok
        const existingSocials = await actor?.getShopSocials(
          (await import("@icp-sdk/core/principal")).Principal.fromText(
            principalId,
          ),
        );

        // Save the URL into the backend shopSocials.photoUrl
        await actor?.updateShopSocials({
          facebook: existingSocials?.facebook ?? "",
          instagram: existingSocials?.instagram ?? "",
          tiktok: existingSocials?.tiktok ?? "",
          photoUrl,
        });

        // Invalidate so ShopDetail and Dashboard re-fetch the new photo
        queryClient.invalidateQueries({
          queryKey: ["shopSocials", principalId],
        });

        // Also cache locally for immediate display
        try {
          localStorage.setItem(`shopPhoto_${principalId}`, photoUrl);
        } catch {
          // ignore storage errors
        }

        return photoUrl;
      } finally {
        setIsUploading(false);
      }
    },
    [identity, actor, queryClient],
  );

  return { uploadPhoto, isUploading };
}
