import { loadCategoriesAndProducts } from './funcs/categorys.js';
import {
    getAndShowHeroBanner,
    initAddToCart,
    getndShowFooterInfos,
    startApp
} from './funcs/products.js'

window.addEventListener('load', () => {
    loadCategoriesAndProducts()
    startApp()
    getAndShowHeroBanner()
    getndShowFooterInfos()
    initAddToCart()

});