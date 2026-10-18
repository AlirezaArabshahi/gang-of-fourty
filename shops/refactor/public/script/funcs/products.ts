import { BASEURL } from '../config.js';
import { showError, renderSkeletons, setBusy } from '../components/skeleton.js';
import { formatPrice } from '../utils/format.js';
import { makeCard } from '../components/productcard.js';
import initSwiper from "../vender/swiper/swiper.js"
import initScrollAnimation from "../vender/motion/motion.js"
import {
    el,
    saveToLocalStorage,
    getCountBasketFromLocalStorage
} from '../utils/utils.js';

import type { Home, Shop, MainCardProps,PromoItem,ProductView
,Schedule} from '.././type.js';

const toFa = (n: number):string => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);


const startApp = async (): Promise<void> => {
    try {
        const products = await getProductsWithDetails();
        getAndShowAllProducts(products);
        getAndShowProducts('.products-track-off', 2, products);
        getAndShowProducts('.product-fruit', 1, products);

        updateSearchPlaceholders(products.length);

        await Promise.all([
            getAndShowHeroBanner(),
            getndShowFooterInfos()
        ]);
    } catch (err: unknown) {
        console.error('خطا در بارگیری اطلاعات برنامه:', err);
    }
};

const createHeroSlider = (slide: MainCardProps): HTMLElement => {
    const swiper = el('div', 'swiper');
    const wrapper = el('div', 'swiper-wrapper');

    for (let index = 0; index < 4; index += 1) {
        const item = el('div', 'swiper-slide');
        item.append(createMainCard(slide));
        wrapper.append(item);
    }

    swiper.append(wrapper, el('div', 'swiper-pagination'));

    return swiper;
};

const createMainCard = (slide: MainCardProps): HTMLElement => {
    const main = el('article', 'hero-main');

    const emoji = el('span', 'hero-emoji', slide.emoji);
    emoji.setAttribute('aria-hidden', 'true');
    const button = el('a', 'btn btn-primary', slide.cta.label);
    button.href = slide.cta.href;

    main.append(
        emoji,
        el('h2', 'hero-title', slide.title),
        el('p', 'hero-text', slide.text),
        button
    );

    return main;
};

const createSideCard = (slide: MainCardProps): HTMLElement => {
    const side = el('article', 'hero-side');

    const emoji = el('span', 'hero-emoji', slide.emoji);
    emoji.setAttribute('aria-hidden', 'true');

    const button = el('a', 'btn btn-secondary', slide.cta.label);
    button.href = slide.cta.href;

    side.append(
        emoji,
        el('h2', 'side-title', slide.title),
        el('p', 'side-text', slide.text),
        button
    );

    return side;
};

const createPromos = (promos: PromoItem[]): HTMLElement => {
    const container = el('div', 'hero-promos');

    promos.forEach(({ href, bg, emoji, text }) => {
        const promo = el('a', 'hero-promo');
        promo.href = href;
        promo.style.setProperty('--promo-bg', bg);

        const emojiSpan = el('span', null, emoji);
        emojiSpan.setAttribute('aria-hidden', 'true');
        promo.append(emojiSpan, el('span', null, text));
        container.append(promo);
    });

    return container;
};

const renderHero = (home: Home): void => {
    const heroGrid = document.querySelector<HTMLElement>('.hero-grid');

    if (heroGrid) {
        heroGrid.textContent = '';
        heroGrid.append(
            createHeroSlider(home.hero),
            createSideCard(home.side),
            createPromos(home.promos)
        );

        initSwiper();
    }
};

// const getAndShowHeroBanner = async (): Promise<boolean> => {
//     const heroGrid = document.querySelector<HTMLDivElement>('.hero-grid');

//     if (heroGrid) {
//         showError(heroGrid, 'در حال بارگیری ...');

//         try {
//             const response = await fetch(`${BASEURL}/home.json`);

//             if (!response.ok) {
//                 throw new Error(`HTTP ${response.status}`);
//             }

//             const data = await response.json();
//             renderHero(data);

//             return true;
//         } catch (err: unknown) {
//             showError(heroGrid, 'خطا در بارگیری بنرها. لطفاً دوباره تلاش کنید.');

//             if (err instanceof Error) {
//                 console.error('خطا در دریافت اطلاعات بنرها:', err.message);
//             }
//         }
//     }
//     return false;
// };

// const getProductsWithDetails = async (): Promise<ProductView[]> => {
//     const [productsRes, stocksRes, offersRes] = await Promise.all([
//         fetch(`${BASEURL}/products.json`),
//         fetch(`${BASEURL}/stock.json`),
//         fetch(`${BASEURL}/offers.json`),
//     ]);

//     if (!productsRes.ok || !stocksRes.ok || !offersRes.ok) {
//         throw new Error('خطا در دریافت اطلاعات محصولات.');
//     }

//     const products: ApiProduct[] = await productsRes.json();
//     const stock: Stock = await stocksRes.json();
//     const offers: Offer[] = await offersRes.json();


//     return products.map((product) => {
//         const offer = offers.find(
//             (item) => item.productId === product.id
//         );
//         return {
//             ...product,
//             stock: stock.items[product.id] ?? 0,
//             off: offer?.percent,
//             oldPrice: offer ? product.price : undefined,
//             price: offer
//                 ? Math.round(product.price * (1 - offer.percent / 100))
//                 : product.price,
//         };
//     });
// };

const getAndShowProducts = (
    trackSelector: string,
    categoryId: number,
    products: ProductView[]
): void => {
    const track = document.querySelector<HTMLElement>(trackSelector);

    if (!track) return;

    const filtered = products.filter(
        (product) => product.categoryId === categoryId
    );

    if (filtered.length === 0) {
        showError(track, 'محصولی برای نمایش وجود ندارد.');
        return;
    }

    track.textContent = '';
    track.append(...filtered.map(makeCard));

    initScrollAnimation();
};


const getAndShowAllProducts = (products: ProductView[]): void => {
    const track = document.querySelector<HTMLUListElement>(
        '.products-track-latest'
    );
    if (track) {

        const filteredProducts = products.filter(
            (product) => product.off !== undefined
        );

        if (!filteredProducts.length) {
            showError(
                track,
                'محصول تخفیف‌داری برای نمایش وجود ندارد.'
            );
            return;
        }

        track.textContent = '';
        track.append(...filteredProducts.map(makeCard));

        initScrollAnimation();
    }
};


const updateSearchPlaceholders = (count: number): void => {
    document.querySelectorAll<HTMLInputElement>('#q').forEach((input) => {
        input.placeholder = `جست و جو در میان ${toFa(count)} کالا`;
    });
};


const createLinkColumn = (id: string, title: string, links: FooterLink[]): HTMLElement => {
    const nav = el('nav');
    nav.setAttribute('aria-labelledby', id);

    const heading = el('h2', 'footer-col-title', title);
    heading.id = id;

    const list = el('ul', 'footer-col-list');

    links.forEach(({ href, label }) => {
        const li = el('li');
        const a = el('a', null, label);
        a.href = href;
        li.append(a);
        list.append(li);
    });

    nav.append(heading, list);

    return nav;
};

const createWorkingHours = (schedule: Schedule[]): HTMLElement => {
    const section = el('section');
    section.setAttribute('aria-labelledby', 'f-hours');

    const heading = el('h2', 'footer-col-title', 'ساعت کاری');
    heading.id = 'f-hours';

    const list = el('ul', 'footer-col-list');

    schedule.forEach(({ days, time }) => {
        const li = el('li');
        li.append(days, el('bdi', null, time));
        list.append(li);
    });

    section.append(heading, list);

    return section;
};

const createContactRow = (label: string, value: string, href?: string): HTMLElement => {
    const row = el('div', 'footer-contact-row');
    row.append(el('span', 'footer-contact-label', `${label}:`));

    const bdi = el('bdi', null, value);

    if (href) {
        const link = el('a', 'footer-contact-value');
        link.href = href;
        link.append(bdi);
        row.append(link);
    } else {
        const text = el('span', 'footer-contact-value');
        text.append(bdi);
        row.append(text);
    }

    return row;
};

const createAboutDesc = (shop: Shop): HTMLElement => {
    const paragraph = el('p', 'footer-about-desc');

    paragraph.append(
        `${shop.about} هزینه ارسال `,
        el('bdi', null, formatPrice(shop.deliveryFee)),
        ` ${shop.currency} است و برای خریدهای بالای `,
        el('bdi', null, toFa(shop.freeDeliveryOver / 1000)),
        ` هزار ${shop.currency}، ارسال رایگان است.`
    );

    return paragraph;
};

const renderFooter = (shop: Shop): void => {
    const footerCols = document.querySelector<HTMLElement>('.footer-cols');
    const footerContact = document.querySelector<HTMLElement>('.footer-contact');
    const footerAbout = document.querySelector<HTMLElement>('.footer-about');

    if (footerAbout && footerContact && footerCols) {
        footerAbout.querySelector('.footer-about-desc')?.remove();
        footerAbout.append(createAboutDesc(shop));


        footerContact.textContent = '';
        footerContact.append(
            createContactRow('تلفن', shop.phone, `tel:${shop.phone}`),
            createContactRow('آدرس', shop.address)
        );

        footerCols.textContent = '';
        footerCols.append(
            createLinkColumn('f-quick', 'دسترسی‌های سریع', shop.menu),
            createLinkColumn('f-help', 'راهنمای مشتریان', shop.help),
            createWorkingHours(shop.schedule)
        );
        setBusy(footerCols, false);
    }
};

// const getndShowFooterInfos = async (): Promise<boolean> => {
//     const footerCols = document.querySelector<HTMLElement>('.footer-cols');

//     try {
//         const response = await fetch(`${BASEURL}/shop.json`);
//         if (!response.ok) {
//             throw new Error(`HTTP ${response.status}`);
//         }

//         const data: Shop = await response.json();
//         renderFooter(data);

//         return true;
//     } catch (err: unknown) {
//         if (footerCols) {
//             showError(footerCols, 'خطا در بارگیری اطلاعات فروشگاه.');
//         }

//         if (err instanceof Error) {
//             console.error('خطا در دریافت اطلاعات فوتر:', err.message);
//         }

//         return false;
//     }
// };



const updateBadge = (): void => {
    const count = getCountBasketFromLocalStorage();
    const badge = document.querySelectorAll(".bage-basket");
    document.querySelectorAll<HTMLElement>('.cart-badge').forEach((badge) => {
        badge.textContent = toFa(count);
        badge.closest('a')?.setAttribute('aria-label', `سبد خرید، ${formatNumber(count)} کالا`);
    });
};

const initAddToCart = (): void => {
    updateBadge()
    document.addEventListener("click", (e: MouseEvent) => {
        const target = e.target instanceof Element ? e.target : null;
        const button = target?.closest<HTMLButtonElement>(".act-btn.act-cart");

        if (button && !button.disabled) {
            saveToLocalStorage(getCountBasketFromLocalStorage() + 1)
            updateBadge();
        }
    });
}

export {
    getAndShowHeroBanner,
    getndShowFooterInfos,
    updateSearchPlaceholders,
    initAddToCart,
    startApp

};
