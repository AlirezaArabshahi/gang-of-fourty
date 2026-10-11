import { BASEURL } from '../config.js';
import { showError, renderSkeletons } from '../components/skeleton.js';
import { makeCard } from '../components/productcard.js';
import { el } from '../utils/dom.js';

const toFa = (n) => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹' [d]);


const createMainCard = (p) => {
    const main = el("article", "hero-main");

    const emoji = el("span", "hero-emoji");
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = "🍉";

    const title = el("h2", "hero-title");
    title.textContent = `${p.title}`

    const text = el("p", "hero-text");
    text.textContent = `${p.text}`

    const btn = el("a", "btn btn-primary");
    btn.href = `#${p.cta.href}`;
    btn.textContent = `${p.cta?.label ? p.cta.label : "افزودن محصول"}`;

    main.append(emoji, title, text, btn);
    return main;
};

const createSideCard = (p) => {
    const side = el("article", "hero-side");

    const emoji = el("span", "hero-emoji");
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = "🧀";

    const title = el("h2", "side-title");
    title.textContent = `${p.title}`;

    const text = el("p", "side-text");
    text.textContent = `${p.text}`;

    const btn = el("a", "btn btn-secondary");
    btn.href = `#${p.cta.href}`;
    btn.textContent = `${p.cta.label}`;

    side.append(emoji, title, text, btn);
    return side;
};

const createPromos = (p) => {
    const promos = el("div", "hero-promos");

    p.forEach(({ href, bg, emoji, text }) => {
        const promo = el("a", "hero-promo");
        promo.href = href;
        promo.style.setProperty("--promo-bg", bg);

        const emojiSpan = el("span");
        emojiSpan.setAttribute("aria-hidden", "true");
        emojiSpan.textContent = emoji;

        const textSpan = el("span");
        textSpan.textContent = text;

        promo.append(emojiSpan, textSpan);
        promos.append(promo);
    });

    return promos;
};


const getAndShowHeroBanner = async() => {
    const heroGrid = document.querySelector('.hero-grid');
    if (!heroGrid) return false;

    renderSkeletons(heroGrid);
    showError(heroGrid, 'در حال بارگیری ...');

    try {
        const response = await fetch(`${BASEURL}/home.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        heroGrid.textContent = ''
        heroGrid.append(
            createMainCard(data.hero),
            createSideCard(data.side),
            createPromos(data.promos)
        )
        return true

    } catch (err) {
        showError(heroGrid, 'خطا در بارگیری.');
        return false;
    }
}


const getProductsWithDetails = async() => {
    const [productsRes, stocksRes, offersRes] = await Promise.all([
        fetch(`${BASEURL}/products.json`),
        fetch(`${BASEURL}/stock.json`),
        fetch(`${BASEURL}/offers.json`),
    ])

    if (!productsRes.ok || !stocksRes.ok || !offersRes.ok) {
        throw new Error(
            `fetch failed: products=${productsRes.status}, ` +
            `stock=${stocksRes.status}, offers=${offersRes.status}`
        );
    }

    const [products, stocks, offers] = await Promise.all([
        productsRes.json(),
        stocksRes.json(),
        offersRes.json(),
    ]);


    const finalProduct = products.map((p) => {
        const offerItem = offers.find((o) => o.productId == p.id)
        const stokeItem = stocks.items[p.id] || 0
        return {
            ...p,
            off: offerItem ? offerItem.percent : undefined,
            stock: stokeItem,
            oldPrice: offerItem ?
                Math.round(p.price / (1 - offerItem.percent / 100)) : undefined

        }
    })
    return finalProduct
}


const getAndShowOfferProducts = async() => {
    const track = document.querySelector('.products-track-off');
    const searches = document.querySelectorAll('#q-mobile, #q-desktop')
    if (!track) return;

    renderSkeletons(track);
    showError(track, 'در حال بارگیری ...');

    try {
        const products = await getProductsWithDetails()

        searches.forEach(input => {
            input.placeholder = `جست و جو در میان ${products.length} کالا`
        })

        const filtered = products.filter((p) => p.categoryId === 2);
        if (filtered.length === 0) {
            showError(track, 'محصولی برای نمایش وجود ندارد.');
            return;
        }
        const cards = filtered.map(makeCard);
        track.textContent = '';
        cards.forEach((card) => track.append(card));
    } catch (err) {
        showError(track, 'خطا در بارگیری.');
        return false;
    }
}

const getAndShowAllProducts = () => {
    const productsTrackLatest = document.querySelector('.products-track-latest');
    if (!productsTrackLatest) return;
    renderSkeletons(productsTrackLatest);
    showError(productsTrackLatest, 'در حال بارگیری ...');

    Promise.all([
        fetch(`${BASEURL}/products.json`),
        fetch(`${BASEURL}/stock.json`),
        fetch(`${BASEURL}/offers.json`),
    ])

    .then(responses => {
            responses.forEach(response => {
                if (!response.ok) {
                    showError(productsTrackLatest, 'خطا در دریافت محصولات. لطفاً دوباره تلاش کنید.');
                }
            });
            return Promise.all(responses.map(response => response.json()));
        })
        .then(([products, stock, offers]) => {
            const offerList = offers.map(offer => offer.productId)
            const enriched = products.map(p => {
                const offerItem = offers.find(offer => offer.productId === p.id);
                const stockCount = stock.items[p.id] || 0
                return {
                    ...p,
                    stock: stockCount,
                    off: offerItem ? offerItem.percent : undefined,
                    oldPrice: offerItem ?
                        Math.round(p.price / (1 - offerItem.percent / 100)) : undefined,
                }

            })

            const filteredProducts = enriched.filter(product => offerList.includes(product.id));
            const cards = filteredProducts.map(makeCard);
            productsTrackLatest.textContent = '';
            cards.forEach((card) => productsTrackLatest.append(card));
        })

    .catch((error) => {
        showError(productsTrackLatest, 'اتصال اینترنت برقرار نیست.');

    })
}





export { getAndShowOfferProducts, getAndShowAllProducts, getAndShowHeroBanner };