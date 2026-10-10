// Fetching products data from server

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
        throw error;
    }
    
}

// Find catagoryID by its name
async function getCategoryID(name){
    try {
        const res = await fetch('../../api/categories.json');
        
        if (!res.ok) {
            throw new Error("Failed to fetch categories");
        }

        const categories = await res.json();

        const categoryID = categories.filter(item => item.name === name).id

        return categoryID;
        
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// Get products by their category



async function getDataObjects(url, objectName) {
    const res = await fetch(url);

    if (!res.ok) {
            throw new Error(`Failed to fetch ${objectName}`);
        }

        const resData= await res.json();
        return resData;
}

async function getData() {
    const [categories, products]  = await Promise.all([
        getDataObjects('../../api/categories.json', "categories"),
        getDataObjects('../../api/products.json', "products")]);
    return({categories,products});
}

getData().then(console.log)