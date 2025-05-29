import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import App from "./App";
import LoginPage from "./components/LoginPage";
import ProfilePage from "./components/ProfilePage";

// Define root route
const rootRoute = createRootRoute({
  component: App,
});

// Define child routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: ProfilePage,
});

// Create route tree
const routeTree = rootRoute.addChildren([loginRoute, profileRoute]);

// Create router
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

// Register router for type safety
// declare module '@tanstack/react-router' {
//   interface Register {
//     router: typeof router
//   }
// }
