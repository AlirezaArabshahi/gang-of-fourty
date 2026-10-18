

//  const el =<T extends keyof HTMLElementTagNameMap> (tag:T, className?:string | null, text?:string) :HTMLElementTagNameMap[T]=> {
//      const node = document.createElement(tag);
//      if (className) node.className = className;
//      if (text != null) node.textContent = text;
//      return node;
//  };

//  const makeIcon = (id:string, cls:string = 'icon')=> {
//      const NS = 'http://www.w3.org/2000/svg';
//      const svg = document.createElementNS(NS, 'svg');
//      const use = document.createElementNS(NS, 'use');
//      svg.setAttribute('class', cls);
//      svg.setAttribute('aria-hidden', 'true');
//      svg.setAttribute('focusable', 'false');
//      use.setAttribute('href', `#${id}`);
//      svg.append(use);
//      return svg;
//  };

//  const makeButton = (className:string, label:string, iconId:string, text:string) => {
//      const btn = el('button', className);
//      btn.type = 'button';
//      btn.setAttribute('aria-label', label);
//      btn.append(makeIcon(iconId));
//      if (text) btn.append(el('span', null, text));
//      return btn;
//  };

//  const saveToLocalStorage = (count:number):void => {
//      localStorage.setItem("count", String((count)));
//  };

//  const getCountBasketFromLocalStorage = () => {
//      return Number(localStorage.getItem("count")) || 0;
//  };


//  export {
//      el,
//      makeIcon,
//      makeButton,
//      saveToLocalStorage,
//      getCountBasketFromLocalStorage
//  }




type MakeButtonOptions = {
  className?: string;
  iconId: string;
  label: string;
  text?: string;
  type?: HTMLButtonElement['type'];
}

const el = <T extends keyof HTMLElementTagNameMap>(
  tag: T,
  className?: string | null,
  text?: string
): HTMLElementTagNameMap[T] => {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = text;
  }

  return node;
};

const makeIcon = (
  id: string,
  className = 'icon'
): SVGSVGElement => {
  const namespace = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(namespace, 'svg');
  const use = document.createElementNS(namespace, 'use');

  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  use.setAttribute('href', `#${id}`);
  svg.append(use);

  return svg;
};

const makeButton = ({
    className,
    label,
    iconId,
    text,
    type = 'button',
}: MakeButtonOptions): HTMLButtonElement => {
    const button = el('button', className);
    button.type = type;
    button.setAttribute('aria-label', label);
    button.append(makeIcon(iconId));

    if (text !== undefined) {
        button.append(el('span', null, text));
    }

    return button;
};
const saveToLocalStorage = (count: number): void => {
  localStorage.setItem("count", String((count)));
};

const getCountBasketFromLocalStorage = (): number => {
  try {
    return Number(localStorage.getItem('count')) || 0;
  } catch {
    return 0;
  }
};

export {
  el,
  makeIcon,
  makeButton,
  saveToLocalStorage,
  getCountBasketFromLocalStorage,
};

export type { MakeButtonOptions };
