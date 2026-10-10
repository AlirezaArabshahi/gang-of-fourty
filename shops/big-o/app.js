// fetching products data from server

async function getProducts() {
    try {
        const response = await fetch('../../api/products.json');

        if (!response.ok) {
            throw new Error("Failed to fetch products");
        }

        const products = await response.json();

        return products;

    } catch (error) {
        console.error(error);
    }
    
}

getProducts().then(console.log)
