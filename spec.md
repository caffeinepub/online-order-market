# Online Order Market

## Current State
Full-stack marketplace with Home, ShopDetail, OwnerLogin, OwnerDashboard pages. Bilingual EN/SW. ShopData has: businessName, ownerName, phone, address. No photo support. Shop cards show a generic Store icon.

## Requested Changes (Diff)

### Add
- `photoUrl` optional field to `ShopData` in the Motoko backend
- Blob-storage component for uploading shop profile photos
- In OwnerDashboard > Shop Settings tab: a photo upload section where owner can upload/change their shop photo (shown as a preview)
- On Home page shop cards: display the shop photo as a banner/avatar at the top of the card instead of the generic Store icon
- On ShopDetail page: display the shop photo in the banner header

### Modify
- `registerShop` and `updateShop` backend calls to include optional `photoUrl`
- Shop cards in Home.tsx: show photo if available, fallback to colorful gradient placeholder with Store icon
- ShopDetail banner: show photo if available, fallback to current icon

### Remove
- Nothing

## Implementation Plan
1. Select blob-storage component
2. Regenerate Motoko backend with photoUrl added to ShopData
3. Update frontend: OwnerDashboard settings tab gets photo upload with preview
4. Update Home.tsx shop cards to show photo
5. Update ShopDetail.tsx banner to show photo
6. Validate build
