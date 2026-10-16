 
 
 const el =<T extends keyof HTMLElementTagNameMap> (tag:T, className?:string | null, text?:string) :HTMLElementTagNameMap[T]=> {
     const node = document.createElement(tag);
     if (className) node.className = className;
     if (text != null) node.textContent = text;
     return node;
 };

 const makeIcon = (id:string, cls:string = 'icon')=> {
     const NS = 'http://www.w3.org/2000/svg';
     const svg = document.createElementNS(NS, 'svg');
     const use = document.createElementNS(NS, 'use');
     svg.setAttribute('class', cls);
     svg.setAttribute('aria-hidden', 'true');
     svg.setAttribute('focusable', 'false');
     use.setAttribute('href', `#${id}`);
     svg.append(use);
     return svg;
 };

 const makeButton = (className:string, label:string, iconId:string, text:string) => {
     const btn = el('button', className);
     btn.type = 'button';
     btn.setAttribute('aria-label', label);
     btn.append(makeIcon(iconId));
     if (text) btn.append(el('span', null, text));
     return btn;
 };

 const saveToLocalStorage = (count:number):void => {
     localStorage.setItem("count", String((count)));
 };

 const getCountBasketFromLocalStorage = () => {
     return Number(localStorage.getItem("count")) || 0;
 };


 export {
     el,
     makeIcon,
     makeButton,
     saveToLocalStorage,
     getCountBasketFromLocalStorage
 }