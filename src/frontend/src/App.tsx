import { Toaster } from "@/components/ui/sonner";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRootRoute, createRoute } from "@tanstack/react-router";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerLogin from "./pages/OwnerLogin";
import ShopDetail from "./pages/ShopDetail";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const shopDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/shop/$ownerPrincipal",
  component: ShopDetail,
});

const ownerLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/login",
  component: OwnerLogin,
});

const ownerDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/owner/dashboard",
  component: OwnerDashboard,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  shopDetailRoute,
  ownerLoginRoute,
  ownerDashboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </LanguageProvider>
  );
}
