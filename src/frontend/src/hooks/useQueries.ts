import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Order, Product, ShopData } from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity as useInternetIdentityHook } from "./useInternetIdentity";

export function useGetAllShops() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Array<[Principal, ShopData]>>({
    queryKey: ["allShops"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllShops();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30_000,
  });
}

export function useGetProductsForShop(shopOwner: Principal | null) {
  const { actor } = useActor();
  return useQuery<Product[]>({
    queryKey: ["products", shopOwner?.toString()],
    queryFn: async () => {
      if (!actor || !shopOwner) return [];
      return actor.getProductsForShop(shopOwner);
    },
    enabled: !!actor && !!shopOwner,
    retry: 3,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function usePlaceOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopOwner,
      order,
    }: { shopOwner: Principal; order: Order }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeOrder(shopOwner, order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useGetOrdersForShop() {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrdersForShop();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 15_000,
  });
}

export function useVerifyOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return actor.verifyOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useRegisterShop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopData: ShopData) => {
      if (!actor)
        throw new Error("Not connected. Please log in and try again.");
      return actor.registerShop(shopData);
    },
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allShops"] });
      queryClient.invalidateQueries({ queryKey: ["myShop"] });
    },
  });
}

export function useUpdateShop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shopData: ShopData) => {
      if (!actor)
        throw new Error("Not connected. Please log in and try again.");
      return actor.updateShop(shopData);
    },
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allShops"] });
      queryClient.invalidateQueries({ queryKey: ["myShop"] });
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor)
        throw new Error("Not connected. Please log in and try again.");
      return actor.addProduct(product);
    },
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productPhotos"] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor)
        throw new Error("Not connected. Please log in and try again.");
      return actor.updateProduct(product);
    },
    retry: 2,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productPhotos"] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productName: string) => {
      if (!actor)
        throw new Error("Not connected. Please log in and try again.");
      return actor.deleteProduct(productName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useGetMyProducts() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentityHook();
  return useQuery<Product[]>({
    queryKey: ["products", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getProductsForShop(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile({ name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useDeleteMyShop() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMyShop();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allShops"] });
      queryClient.invalidateQueries({ queryKey: ["myShop"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useGetCustomerOrders(phone: string) {
  const { actor, isFetching: actorFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["customerOrders", phone],
    queryFn: async () => {
      if (!actor || !phone) return [];
      return actor.getCustomerOrders(phone);
    },
    enabled: !!actor && !actorFetching && phone.length === 10,
  });
}

export function useSubmitPaymentProof() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      shopOwner,
      orderIndex,
      proofText,
      screenshotUrl,
    }: {
      shopOwner: Principal;
      orderIndex: bigint;
      proofText: string;
      screenshotUrl: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitPaymentProof(
        shopOwner,
        orderIndex,
        proofText,
        screenshotUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
    },
  });
}

export function useGetProductPhotos(shopOwner: Principal | null) {
  const { actor } = useActor();
  return useQuery<Array<[string, string]>>({
    queryKey: ["productPhotos", shopOwner?.toString()],
    queryFn: async () => {
      if (!actor || !shopOwner) return [];
      return (actor as any).getProductPhotos(shopOwner);
    },
    enabled: !!actor && !!shopOwner,
    retry: 3,
    staleTime: 0,
    refetchOnMount: true,
  });
}
