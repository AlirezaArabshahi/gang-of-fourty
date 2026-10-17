import Swiper from "swiper/bundle";
import "swiper/css/bundle";
import "./swiper.css"


const initSwiper = () => {
    new Swiper(".swiper", {
        slidesPerView: 1,
        loop: true,
        speed: 800,
        effect: "fade",
        fadeEffect: {
            crossFade: true,
        },
        autoplay: {
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },
    });
};

export default initSwiper;