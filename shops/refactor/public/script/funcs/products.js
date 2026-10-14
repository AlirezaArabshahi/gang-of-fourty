import { BASEURL } from '../config.js';
import { showError, renderSkeletons } from '../components/skeleton.js';
import { makeCard } from '../components/productcard.js';
import { el } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';

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
    getAndShowProductTrack(finalProduct)
    return finalProduct
}

const getAndShowProducts = async(trackSelector, categoryId) => {
    const track = document.querySelector(trackSelector);

    if (!track) return;

    renderSkeletons(track);
    showError(track, 'در حال بارگیری ...');

    try {
        const products = await getProductsWithDetails();

        const filtered = products.filter(
            p => p.categoryId === categoryId
        );

        if (filtered.length === 0) {
            showError(track, 'محصولی برای نمایش وجود ندارد.');
            return;
        }

        const cards = filtered.map(makeCard);

        track.textContent = '';
        track.append(...cards);

    } catch (err) {
        showError(track, 'خطا در بارگیری.');
        return false;
    }
};


const getAndShowAllProducts = () => {
    const productsTrackLatest = document.querySelector('.products-track-latest');
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


const getAndShowProductTrack = async(finalProduct) => {
    const productsTrack = document.querySelector(".products-track")
    const test = finalProduct.filter((p) => p.categoryId == "1")
    console.log(test);

}

const updateSearchPlaceholders = () => {
    const searches = document.querySelectorAll('#q-mobile, #q-desktop')
    searches.forEach(input => {
        input.placeholder = `جست و جو در میان ${products.length} کالا`
    })
}



const createQuickLinks = (p) => {
    const nav = el("nav");
    nav.setAttribute("aria-labelledby", "f-quick");

    const title = el("h2", "footer-col-title");
    title.id = "f-quick";
    title.textContent = "دسترسی‌های سریع";

    const list = el("ul", "footer-col-list");

    p.forEach(({ href, label }) => {
        const li = el("li");
        const a = el("a");
        a.href = href;
        a.textContent = label;
        li.append(a);
        list.append(li);
    });

    nav.append(title, list);
    return nav;
};


const createHelpLinks = (links) => {
    const nav = el("nav");
    nav.setAttribute("aria-labelledby", "f-help");

    const title = el("h2", "footer-col-title");
    title.id = "f-help";
    title.textContent = "راهنمای مشتریان";

    const list = el("ul", "footer-col-list");

    links.forEach(({ label, href }) => {
        const li = el("li");
        const a = el("a");
        a.href = href;
        a.textContent = label;
        li.append(a);
        list.append(li);
    });

    nav.append(title, list);
    return nav;
};


const createWorkingHours = (p) => {
    const section = el("section");
    section.setAttribute("aria-labelledby", "f-hours");

    const title = el("h2", "footer-col-title");
    title.id = "f-hours";
    title.textContent = "ساعت کاری";

    const list = el("ul", "footer-col-list");
    p.forEach(({ days, time }) => {
        const li = el("li");
        li.append(document.createTextNode(days));

        const bdi = el("bdi");
        bdi.textContent = time;
        li.append(bdi);

        list.append(li);
    });

    section.append(title, list);
    return section;
};

const createContactRow = (label, value, href) => {
    const row = el("div", "footer-contact-row");

    const labelSpan = el("span", "footer-contact-label");
    labelSpan.textContent = `${label}:`;

    const valueEl = el(href ? "a" : "span", "footer-contact-value");
    if (href) valueEl.href = href;

    const bdi = el("bdi");
    bdi.textContent = value;
    valueEl.append(bdi);

    row.append(labelSpan, valueEl);
    return row;
};


const createAboutDesc = ({ about, deliveryFee, freeDeliveryOver, currency }) => {
    const p = el("p", "footer-about-desc");

    const fee = el("bdi");
    fee.textContent = formatPrice(deliveryFee);

    const threshold = el("bdi");
    threshold.textContent = formatPrice(freeDeliveryOver / 1000);

    p.append(
        `${about} هزینه ارسال `,
        fee,
        ` ${currency} است و برای خریدهای بالای `,
        threshold,
        ` هزار ${currency}، ارسال رایگان است.`
    );
    return p;
};

const getndShowFooterInfos = async() => {
    const footerCols = document.querySelector(".footer-cols")
    const footerContact = document.querySelector(".footer-contact")
    const footerAbout = document.querySelector(".footer-about")

    showError(footerCols, 'در حال بارگیری ...');

    try {
        const response = await fetch(`${BASEURL}/shop.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        footerAbout.append(createAboutDesc(data));
        footerContact.append(
            createContactRow("تلفن", data.phone),
            createContactRow("آدرس", data.address)
        )
        footerCols.textContent = ''

        footerCols.append(
            createQuickLinks(data.menu),
            createHelpLinks(data.help),
            createWorkingHours(data.schedule)
        )
        return true

    } catch (err) {
        showError(heroGrid, 'خطا در بارگیری.');
        return false;
    }
}



getAndShowProducts(".products-track-off", 2)
export { getAndShowAllProducts, getAndShowHeroBanner, getndShowFooterInfos, updateSearchPlaceholders };