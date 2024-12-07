const Sequelize = require('sequelize');

const sequelize = new Sequelize('neondb', 'neondb_owner', 'AQ6HlZfyadb7', {
    host: 'ep-tiny-dust-a5efxun0-pooler.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
});

const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE,
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: 'category' });

function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve())
            .catch((err) => reject("Unable to sync the database: " + err));
    });
}

function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("No items found");
                }
            })
            .catch((err) => reject("Error fetching items: " + err));
    });
}

function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
            },
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("No published items found");
                }
            })
            .catch((err) => reject("Error fetching published items: " + err));
    });
}

function getCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((categories) => {
                if (categories.length > 0) {
                    resolve(categories);
                } else {
                    reject("No categories found");
                }
            })
            .catch((err) => reject("Error fetching categories: " + err));
    });
}

function addItem(itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        itemData.postDate = new Date();
        itemData.price = parseFloat(itemData.price);

        for (let key in itemData) {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        }

        Item.create(itemData)
            .then((newItem) => resolve(newItem))
            .catch((err) => reject("Unable to create item: " + err));
    });
}

function getItemsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                category: categoryId,
            },
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("No items found for category " + categoryId);
                }
            })
            .catch((err) => reject("Error fetching items by category: " + err));
    });
}

function getItemsByMinDate(minDateStr) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [Sequelize.Op.gte]: new Date(minDateStr),
                },
            },
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("No items found from the given date onwards");
                }
            })
            .catch((err) => reject("Error fetching items by date: " + err));
    });
}

function getItemById(id) {
    return new Promise((resolve, reject) => {
        Item.findOne({
            where: { id: id },
        })
            .then((item) => {
                if (item) {
                    resolve(item);
                } else {
                    reject("Item not found with ID " + id);
                }
            })
            .catch((err) => reject("Error fetching item by ID: " + err));
    });
}

function getPublishedItemsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: categoryId,
            },
        })
            .then((items) => {
                if (items.length > 0) {
                    resolve(items);
                } else {
                    reject("No published items found for category " + categoryId);
                }
            })
            .catch((err) => reject("Error fetching published items by category: " + err));
    });
}

function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }
        Category.create(categoryData)
            .then(() => resolve("Category added successfully"))
            .catch((err) => reject("Unable to create category: " + err));
    });
}


function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id: id } })
            .then((result) => {
                if (result) {
                    resolve("Category deleted successfully");
                } else {
                    reject("Category not found");
                }
            })
            .catch((err) => reject("Unable to remove category: " + err));
    });
}

function deletePostById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id: id } })
            .then((result) => {
                if (result > 0) {
                    resolve("Item deleted successfully");
                } else {
                    reject("Item not found");
                }
            })
            .catch((err) => reject("Unable to remove item: " + err));
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
    getItemById,
    getPublishedItemsByCategory,
    addCategory,
    deleteCategoryById,
    deletePostById
};
