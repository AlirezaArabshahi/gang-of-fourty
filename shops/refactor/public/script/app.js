import { getAndShowCategories, getAndShowSubMenus } from './funcs/categorys.js';
import { getAndShowOfferProducts, getAndShowAllProducts, getAndShowHeroBanner } from './funcs/products.js'

window.addEventListener('load', () => {
    getAndShowCategories();
    getAndShowOfferProducts();
    getAndShowAllProducts();
    getAndShowSubMenus()
    getAndShowHeroBanner()
});