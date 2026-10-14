import { getAndShowCategories, getAndShowSubMenus } from './funcs/categorys.js';
import { getAndShowAllProducts, getAndShowHeroBanner, getndShowFooterInfos } from './funcs/products.js'

window.addEventListener('load', () => {
    getAndShowCategories();
    getAndShowAllProducts();
    getAndShowSubMenus()
    getAndShowHeroBanner()
    getndShowFooterInfos()
});