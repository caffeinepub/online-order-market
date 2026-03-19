import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActor } from "./useActor";

export interface UserLocation {
  lat: number;
  lng: number;
}

// Hook to get a shop's saved location
export function useShopLocation(principalId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<{ latitude: number; longitude: number } | null>({
    queryKey: ["shopLocation", principalId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const result = await actor.getShopLocation(
          Principal.fromText(principalId),
        );
        return result ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principalId,
    staleTime: 5 * 60 * 1000,
  });
}

// Mutation to save the current owner's shop location
export function useSaveShopLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ lat, lng }: { lat: number; lng: number }) => {
      if (!actor) throw new Error("Not connected");
      await actor.setShopLocation(lat, lng);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopLocation"] });
    },
  });
}

// Hook to get the user's browser geolocation with live watching
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    stopWatch();
    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to get location");
        setLoading(false);
      },
      { timeout: 15000, maximumAge: 30 * 1000, enableHighAccuracy: false },
    );
    watchIdRef.current = id;
  }, [stopWatch]);

  // Auto-request on mount — browser will prompt the user
  useEffect(() => {
    if (navigator.geolocation) {
      requestLocation();
    }
    return () => {
      stopWatch();
    };
  }, [requestLocation, stopWatch]);

  return { location, loading, error, requestLocation };
}
