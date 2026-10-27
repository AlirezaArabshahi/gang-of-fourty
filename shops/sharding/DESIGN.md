# Sharding Design

## 1. Requirements

What the user can do:
- See the shop info, hero, banners, categories and product shelves (all from the API).
- Filter by category and search products by name.
- See price, discount and if the product is in stock.
- Add a product to the cart, change the quantity, remove it. Quantity can't be more than stock.
- See the cart count in the header and open a small cart panel with items and an estimated total.
- Keep the cart after refresh (localStorage).
- Keep the selected category in the URL (`?cat=dairy`), so refresh or sharing the link doesn't lose it.
- Choose light / dark / system theme.

Out of scope:
- Accounts and login.
- Payment and real checkout.
- Changing the shared `/api/` files or making a backend.

## 2. Page sections

- Header: logo, menu, search, cart badge, theme switch
- Hero: video, title, text, button (from `home.json`)
- Banners: promo carousel
- Categories: list + filter
- Shelves: one carousel per category + offers
- Product card: image, name, price, discount, stock, add/quantity buttons
- Cart panel: items, quantities, remove, total
- Footer: about, links, contact, working hours

## 3. Data and who owns it

| Data | Where | Owner |
|---|---|---|
| products, prices | products.json | server |
| categories | categories.json | server |
| offers | offers.json | server |
| stock | stock.json | server |
| shop info | shop.json | server |
| hero and shelves config | home.json | server |
| cart (id and quantity only) | state + localStorage | browser |
| selected category | state + URL | URL |
| theme | localStorage | browser |
| API address | .env files | build config |

The cart only keeps product ids and quantities. Price, discount and stock are always read from the API, so the cart never has an old price.
API data is not trusted until a type guard checks it, because TypeScript types don't exist at runtime.

## 4. API contract

The API is read only, I don't change it. The base address is `VITE_API_URL`.

shop.json, home.json, products.json, categories.json, offers.json and stock.json are all loaded once at start with `Promise.allSettled`, so if one fails the others still work.

Relations: `Product.categoryId` = `Category.id`, `Offer.productId` = `Product.id`, `Stock.items` is keyed by product id.

`getJSON(path)` returns `Promise<unknown>` and throws `HTTPError` on bad status or `AbortError` on timeout. After that each data type has its own guard (`isProduct`, `isCategory`, `isOffer`, `isStock`, `isShop`, `isHome`). A bad product is removed and counted in the console, the other products still show. If `products.json` fails entirely, `loadAllData` returns `LoadState` with `status: 'error'` and a friendly Persian message depending on the error type (timeout / network / invalid data).

## 5. States

Products use this union:

```ts
type LoadState =
  | { status: 'loading' }
  | { status: 'success'; products: Product[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };
```

`renderProducts` uses a `switch` on `status` and `assertNever` in the `default`, so a new state gives a compile error until I handle it.

| Section | loading | success | empty | error |
|---|---|---|---|---|
| Header, footer | skeleton | text | hidden | skeleton removed |
| Hero | skeleton | video + text | only title | no button |
| Categories | skeleton | list | only "All" | skeleton removed |
| Shelves | skeleton cards | cards | "no products" | message + retry |
| Search | - | results | "nothing found" | same as empty |
| Cart panel | - | items + total | "cart is empty" | unknown ids skipped |

Empty is not the same as error. I test with `broken.json` and `missing.json` and the page must show a message, not a white page.

## 6. Folders

```text
src/
  types.ts                 types, imports nothing
  content.ts               static image maps (products, categories, banners, promos)

  api/                     data: fetch + type guards (one file per data type)
    get-json.ts            fetch with timeout + HTTPError
    is-record.ts           shared type guard
    products.ts            loadProducts + isProduct
    categories.ts          loadCategories + isCategory
    offers.ts              loadOffers + isOffer
    stock.ts               loadStock + isStock
    shop.ts                loadShop + isShop
    home.ts                loadHome + isHome
    load-all.ts            loads all files with Promise.allSettled, builds LoadState

  storage/                 data: localStorage + URL
    keys.ts                STORAGE_KEYS
    cart-storage.ts        loadCart, saveCart (supports old & new format)
    theme-storage.ts       loadTheme, saveTheme
    url.ts                 getCatParam, setCatParam, clearCatParam

  cart/                    logic: cart rules, pure functions
    cart.ts                addToCart, removeFromCart, removeLine, updateCart, cartCount

  catalog/                 logic: pricing, stock, filters, shelves, view models
    pricing.ts             finalPrice, hasDiscount, formatPrice
    stock.ts               inStock, stockOf
    filters.ts             visibleProducts, shelfProducts
    shelves.ts             buildShelves: turns AppState into ShelfView[]
    to-card.ts             toCard (pure) + cardOf (needs AppState)
    cart-rows.ts           cartRows, cartTotal, buildCartView, pruneCart
    app-state.ts           AppState type + createState

  ui/                      ui: builds the DOM from parameters
    dom.ts                 h, closestTarget, setText
    icons.ts               createIcon
    price-format.ts        priceFmt (UI copy, to avoid importing logic)
    assert-never.ts        assertNever for exhaustive checks
    skeleton.ts            hideSkeletons
    carousel-nav.ts        createCarouselNav
    carousel-controls.ts   setupCarouselControls (scroll + IntersectionObserver)
    header.ts              renderHeaderParts
    mega-menu-view.ts      renderMegaMenu
    mega-menu-events.ts    setupMegaMenu (hover, click, focus, Escape)
    mobile-menu.ts         setupMobileMenu (focus trap)
    hero.ts                renderHero (video text + banners + basket slide)
    hero-video.ts          startHeroVideo
    categories.ts          renderCategories
    category-filter.ts     setupCatFilter + showCategory
    footer.ts              renderFooter
    product-card.ts        renderProductCard
    products-section.ts    renderProducts (switch + never)
    shelf-builder.ts       buildShelf
    shelf-status.ts        renderStatus
    shelves.ts             fillShelf, renderPlaceholder
    cart-badge.ts          updateCartBadge
    cart-button.ts         renderCartButton, refreshCartButtons
    cart-events.ts         setupCartClicks
    cart-feedback.ts       showCartFeedback (toast + confetti)
    cart-panel.ts          renderCart
    cart-panel-toggle.ts   setupCartPanelToggle (open/close, Escape)
    cart-total.ts          renderTotal
    cart-view.ts           renderCartView (badge + rows + total)
    search.ts              setupSearch (Fuse.js)
    search-results.ts      renderSearchResults
    theme.ts               applyTheme, setupTheme
    toast.ts               notyf
    confetti.ts            fireConfetti
    slow-notice.ts         hideSlowNotice
    events.ts              setupStaticEvents, setupDataEvents
    render-page.ts         renderPage (one-shot after load)

  main.ts                  main: state, wiring, start
```

Imports only go down:
- `main` can use `ui`, `logic`, `data`, `types`
- `ui` can use only `ui` and `types`
- `logic` (`cart/`, `catalog/`) can use only `logic` and `types`
- `data` (`api/`, `storage/`) can use only `data` and `types`

Other rules: max 70 lines per file, no `utils.ts` or `helpers.ts`, a function with two jobs becomes two functions, no `any`, `as`, `!` or `@ts-ignore`.


## 7. Security and deploy

- Everything in the browser is public, also the `VITE_*` variables. No secrets or keys in the code or .env.
- A user can change prices, stock and totals in DevTools. So the cart total here is only an estimate. If I add checkout later, the server must calculate the final total from real prices, discounts and stock.
- Text from the API is added with `textContent`, not `innerHTML`.
- `base: './'` and relative asset paths, so `dist/` works under `/shops/<slug>/`.
- `.env.development`: `VITE_API_URL=/api`. `.env.production`: `VITE_API_URL=../../api`.
- Before PR: `npm run check`, `node check-arch.mjs src --shop`, `npm run build` and `npm run preview` with no errors in Console and all files 200 in Network.
