// Helpers you can use
// const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// const toman = (n) => new Intl.NumberFormat('fa-IR').format(n) + ' تومان';
// const $ = (sel) => document.querySelector(sel);

//------------------ CHALLENGE 1 ------------------------
const API = '../../api/';

fetch(API)
    .then((res) => {
        console.log(res.status);
    })
    .catch((e) => {
        console.log(e);
    });

//------------------ CHALLENGE 2 ------------------------

function getJson() {
    return new Promise((resolve, reject) => {});
}
