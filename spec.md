# Online Order Market

## Current State
Full-stack PWA marketplace for Tanzania. Customers browse shops, view products, and place orders. Shop owners register, manage products, handle orders, and set social media links. Blue/white theme, TSh currency, PWA installable, notification system, phone validation.

## Requested Changes (Diff)

### Add
- Shop location (lat/lng) stored in backend per shop; owners can set it from dashboard via browser geolocation or manual input
- Distance display on shop cards and shop detail page (km from customer's current location)
- "Nearby" sorting option and distance badge on each shop card
- Search bar on Home page to filter shops by name, owner, address, or location
- Shop profiles publicly visible to all users (non-logged-in users can view any shop detail page)

### Modify
- Backend: add `ShopLocation` type and `shopLocations` map with `setShopLocation` and `getShopLocation` functions
- `useActor.ts`: only call `_initializeAccessControlWithSecret` when admin token is actually present in URL (fix save issues)
- Home page: add search input above shop grid, add distance badges, add sort by distance toggle
- ShopDetail page: show distance from user's location
- OwnerDashboard: add location section where owner can set their shop coordinates

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate Motoko backend with new `ShopLocation` type, `setShopLocation`, `getShopLocation` functions added to existing backend
2. Update `useActor.ts` to only call admin init when token present
3. Add `useShopLocation` hook for fetching/saving location
4. Add `useUserLocation` hook for browser geolocation
5. Update Home.tsx with search bar, distance badges, and sort by distance
6. Update ShopDetail.tsx with distance display
7. Update OwnerDashboard.tsx with location setting UI
