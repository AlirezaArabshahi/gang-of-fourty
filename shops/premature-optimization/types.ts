export interface MyHTMLElementTagNameMap {
    div: HTMLDivElement;
    span: HTMLSpanElement;
    input: HTMLInputElement;
    button: HTMLButtonElement;
    img: HTMLImageElement;
    p: HTMLParagraphElement;
    a: HTMLAnchorElement;
    ul: HTMLUListElement;
    li: HTMLLIElement;
    section: HTMLElement;
    h, h1, h2, h3, h4: HTMLHeadElement;
}

export type MakeElement = <T extends keyof HTMLElementTagNameMap>(
    tag: T,
    className?: string,
    text?: string
) => HTMLElementTagNameMap[T];

export type AppendLinks = (
    container: Element | HTMLDivElement,
    label: string,
    href: string,
    className?: string
) => HTMLAnchorElement;

export type Cart = Record<string, number>;


export type Product = {
    id: number
    name: string
    image: string
    price: number
    unit: string
    categoryName: string
    categoryId: number
    tags?: string[]
};

export type Offer = {
    productId: number
    percent: number
    label: string
};

export type Stock = {
    items: Record<string, number>
};

export type ProductCardOptions = {
    offer?: Offer
    stock: Stock
    categoryName: string
};

export type OptionsForProduct = (
    product: Product
) => ProductCardOptions

export type CarouselElements = {
    products: HTMLUListElement
    viewport: HTMLDivElement
    previous: HTMLButtonElement
    next: HTMLButtonElement
};

export type CarouselState = {
    offset: number
    step: number
    maxOffset: number
};

export type ShopMenuItem = {
    label: string
    href: string
};

export type ShopScheduleItem = {
    days: string
    time: string
};

export type Shop = {
    name: string
    notice?: string | null
    slogan?: string | null
    about: string
    address: string
    phone: string
    copyright: string
    menu: ShopMenuItem[]
    schedule: ShopScheduleItem[]
    currency: string
}

export type Categories = {
    id: number
    name: string
    slug: string
    image: string
    emoji: string | null
    color: string
}