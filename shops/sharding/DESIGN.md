# Sharding Design

## 1. Requirements

What the user can do:
- See the shop info, hero, banners, categories and product shelves (all from the API).
- Filter by category and search products by name.
- See price, discount and if the product is in stock.
- Add a product to the cart, change the quantity, remove it. Quantity can't be more than stock.
- See the cart count in the header and open a small cart panel with items and an estimated total.
- Keep the cart after refresh (localStorage).
- Keep the selected category and search text in the URL (`?cat=dairy&q=milk`), so refresh or sharing the link doesn't lose them.
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
| selected category, search text | state + URL | URL |
| theme | localStorage | browser |
| API address | .env files | build config |

The cart only keeps product ids and quantities. Price, discount and stock are always read from the API, so the cart never has an old price.
API data is not trusted until a type guard checks it, because TypeScript types don't exist at runtime.

## 4. API contract

The API is read only, I don't change it. The base address is `VITE_API_URL`.

shop.json, home.json, products.json, categories.json, offers.json and stock.json are all loaded once at start with `Promise.allSettled`, so if one fails the others still work.

Relations: `Product.categoryId` = `Category.id`, `Offer.productId` = `Product.id`, `Stock.items` is keyed by product id.

`getJSON(path)` returns `Promise<unknown>` and throws if the response is not ok. After that each data type has its own guard (`isProduct`, `isCategory`, `isOffer`, `isStock`, ...). A bad product is removed and counted in the console, the other products still show.

## 5. States

Products use this union:

```ts
type LoadState =
  | { status: 'loading' }
  | { status: 'success'; products: Product[] }
  | { status: 'empty' }
  | { status: 'error'; message: string };
```

Render uses a `switch` on `status` and a `never` check in `default`, so a new state gives a compile error until I handle it.

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
  types.ts      types, imports nothing
  api/          fetch + type guards (one file per data type: products.ts, categories.ts, ...)
  storage/      localStorage (only place with localStorage)
  url/          read and write ?cat= and ?q=
  cart/         cart rules, pure functions
  catalog/      filter, search, price rules, pure functions
  ui/           builds the DOM from parameters
  main.ts       state, events, start
```
   
Imports only go down:
- main can use ui, logic, data, types
- ui can use only ui and types
- logic (cart, catalog) can use only logic and types
- data (api, storage, url) can use only data and types

Other rules: max 70 lines per file, no utils.ts or helpers.ts, a function with two jobs becomes two functions, no `any`, `as`, `!` or `@ts-ignore`.

Extra credit: after this works I move the code to `features/products` (was catalog/ + shelves, product card and search UI), `features/cart` (was cart/ + cart panel UI) and `shared` (types, api/getJSON, dom helpers). The two features never import each other, only main.ts connects them. ...

## 7. Security and deploy

- Everything in the browser is public, also the `VITE_*` variables. No secrets or keys in the code or .env.
- A user can change prices, stock and totals in DevTools. So the cart total here is only an estimate. If I add checkout later, the server must calculate the final total from real prices, discounts and stock.
- Text from the API is added with `textContent`, not `innerHTML`.
- `base: './'` and relative asset paths, so `dist/` works under `/shops/<slug>/`.
- `.env.development`: `VITE_API_URL=/api`. `.env.production`: `VITE_API_URL=../../api`.
- Before PR: `npm run check`, `node check-arch.mjs src --shop`, `npm run build` and `npm run preview` with no errors in Console and all files 200 in Network.