# Phan He Danh Muc Phan Cap

## Muc tieu

Thay giao dien danh muc gom tab bang mot menu Phoenix cap cha `Danh muc` va ba trang doc lap: `Danh muc`, `Chat lieu`, `Mau`. Moi trang co CRUD day du, con API dam bao khong xoa du lieu dang duoc dung boi hang nhap kho hoac don hang.

## Kien truc

- API giu ProductCategory la aggregate luu tru duy nhat, them type `pattern` va ba controller OOP doc lap: `CategoryController`, `MaterialController`, `PatternController`.
- Route, Validator, Models va Transformers nam trong tung controller theo DNA YTPlus. Validator khai bao truc tiep trong `switch(method)`; khong dung Zod, factory hay singleton.
- ProductCategoryService va ProductCategoryRepository la noi duy nhat xu ly CRUD, identity, dem usage va transaction guard. Controller truyen `resourceType` co dinh, vi vay client khong the ghi nham type qua body.
- `patternId`/`pattern` duoc them vao hang nhap kho, xuyen suot schema, validator, service, transformer va CMS. Quan he den danh muc/chat lieu/mau duoc cap nhat trong cung relation mutation.
- CMS dung mot primitive page/store/service khai bao theo resource config; ba page mong chi khai bao resource. Sidebar render menu Phoenix cap cha-con tu navigation metadata.

## Bao ve du lieu

- Xoa mot resource luon doc va dem lien ket trong cung transaction/lock: hang nhap kho cho ca ba type va OrderItem cho type `category`.
- API tra ve `CATEGORY_IN_USE` kem tong so lien ket va breakdown kho/don hang; CMS hien thi thong bao ro rang va khong xoa row khoi man hinh.
- API giu `/product-categories` de tuong thich nguoc; CMS moi chi dung `/categories`, `/materials`, `/patterns`.

## Kiem thu

- API: schema, ba controller/route/validator, forced type, quan he kho/don hang, Pattern trong inventory.
- CMS: route, navigation hierarchy, page CRUD, form hang nhap kho, mock API va e2e desktop/mobile.
- Chat luong: API unit suite; CMS Vitest, Playwright, lint, typecheck va build.
