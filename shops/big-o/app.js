
// Fetches one JSON file and returns its parsed data.
// Throws if the request fails or the response is not ok (e.g. 404),
// so the caller can show an error message.
// url: path to the JSON file, objectName: used in the error message.
async function getDataObjects(url, objectName) {
    const res = await fetch(url);

    if (!res.ok) {
            throw new Error(`Failed to fetch ${objectName}`);
        }

        const resData= await res.json();
        return resData;
}

// Loads categories and products in parallel with Promise.all,
// so total wait time is the slowest request, not the sum.
// Returns { categories, products }. Any failure is rethrown to the caller.
async function getData() {
    const [categories, products]  = await Promise.all([
        getDataObjects('../../api/categories.json', "categories"),
        getDataObjects('../../api/products.json', "products")]);
    return {categories,products};
}

// Finds a category by its name and returns its id.
// categories: array from categories.json, name: the category to look for.
// Note: find() returns undefined if nothing matches.
function getCategoryID(name, categories){
    const categoryItem = categories.find(element => element.name === name);
    return categoryItem.id
}

// Returns only the products that belong to the given category.
// id: category id (a number), products: array from products.json.
function filterProductsByCategoryID(id,products) {
    const filteredProducts = products.filter(item => item.categoryId === id);
    return filteredProducts;
}




async function init() {
   try {
    const {categories , products} = await getData();

    //Get "لبنیات" products
    const categoryId = getCategoryID("لبنیات", categories);
    const filteredProducts = filterProductsByCategoryID(categoryId, products);
    console.log(filteredProducts)
    
   } catch (error) {
    console.error(error);
   } 
   
}

init();