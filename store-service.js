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

module.exports = {
    initialize,
    getAllItems,
    getPublishedItems,
    getCategories
};
