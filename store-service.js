const fs = require('fs').promises;
const path = require('path');

let items = [];
let categories = [];

async function initialize() {
    try {
        const itemsData = await fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8');
        items = JSON.parse(itemsData);

        const categoriesData = await fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8');
        categories = JSON.parse(categoriesData);
    } catch (error) {
        throw new Error("Unable to read file: " + error.message);
    }
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned");
        }
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No published items found");
        }
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No results returned");
        }
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        if (!itemData.postDate) {
            const today = new Date();
            itemData.postDate = today.toISOString().split('T')[0];
        }

        itemData.price = parseFloat(itemData.price);

        itemData.category = parseInt(itemData.category);

        itemData.id = items.length + 1;
        const newItem = {
            id: itemData.id,
            category: itemData.category,
            postDate: itemData.postDate,
            featureImage: itemData.featureImage || "",
            price: itemData.price,
            title: itemData.title,
            body: itemData.body,
            published: itemData.published
        };
        items.push(newItem);
        resolve(newItem);
    });
}


function getItemsByCategory(category) {
    return new Promise((resolve, reject) => {
        const itemsByCategory = items.filter(item => item.category === parseInt(category));
        itemsByCategory.length > 0 ? resolve(itemsByCategory) : reject("no results returned");
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        const itemsByDate = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        itemsByDate.length > 0 ? resolve(itemsByDate) : reject("no results returned");
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === parseInt(id));
        item ? resolve(item) : reject("no result returned");
    });
}

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories,
    addItem,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById
};
