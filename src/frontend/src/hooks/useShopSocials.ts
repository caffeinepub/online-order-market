import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

export interface ShopSocials {
  facebook: string;
  instagram: string;
  tiktok: string;
  photoUrl?: string;
}

export function useShopSocials(principalId: string): ShopSocials {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery({
    queryKey: ["shopSocials", principalId],
    queryFn: async () => {
      if (!actor || !principalId) return null;
      try {
        const p = Principal.fromText(principalId);
        return await actor.getShopSocials(p);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principalId,
  });
  const data = query.data;
  return {
    facebook: data?.facebook || "",
    instagram: data?.instagram || "",
    tiktok: data?.tiktok || "",
    photoUrl: data?.photoUrl || "",
  };
}

interface SaveSocialsVars {
  principalId: string;
  socials: ShopSocials;
}

export function useSaveShopSocials() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: SaveSocialsVars) => {
      if (!actor) throw new Error("Not connected");
      await actor.updateShopSocials({
        facebook: vars.socials.facebook || "",
        instagram: vars.socials.instagram || "",
        tiktok: vars.socials.tiktok || "",
        photoUrl: vars.socials.photoUrl || "",
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shopSocials", variables.principalId],
      });
    },
  });
}
