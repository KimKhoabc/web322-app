/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
*
*  Name: Kim Khoa Nguyen - Student ID: 104574231 Date: December 6th, 2024
*  Replit Web App URL: https://replit.com/@kimkhoa0905/web322-app
*  GitHub Repository URL: https://github.com/KimKhoabc/web322-app
*
********************************************************************************/

const express = require('express');
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require('./store-service');
const app = express();
const exphbs = require('express-handlebars');

const HTTP_PORT = process.env.PORT || 8080;

const handlebars = exphbs.create({
    helpers: {
        formatDate: function(dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString();
            let day = dateObj.getDate().toString();
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        },
        safeHTML: function(content) {
            return new handlebars.handlebars.SafeString(content);
        },
        navLink: function(url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
                '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3) throw new Error("Handlebars Helper equal needs 2 parameters");
            return (lvalue != rvalue) ? options.inverse(this) : options.fn(this);
        }
    },
    extname: '.hbs',
});

app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


cloudinary.config({
    cloud_name: 'dhi2beyvo',
    api_key: '562113892115896',
    api_secret: 'wbUvixmKOFGtC8-i8AxQGqyxJrc',
    secure: true
});

const upload = multer();

app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/shop", async (req, res) => {
    let viewData = {};

    try {
        let items = [];
        if (req.query.category) {
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            items = await storeService.getPublishedItems();
        }

        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
        let item = items[0];
        viewData.items = items;
        viewData.item = item;
    } catch (err) {
        viewData.message = "No results found";
    }

    try {
        let categories = await storeService.getCategories();
        console.log("Fetched Categories:", categories);
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories found";
        console.error("Error fetching categories:", err);
    }

    console.log("View Data:", viewData);
    res.render("shop", { data: viewData });
});

app.get("/items", (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => {
                if (data.length > 0) {
                    res.render("items", { items: data });
                } else {
                    res.render("items", { message: "No results found" });
                }
            })
            .catch(err => {
                res.render("items", { message: "Error fetching items: " + err });
            });
    } else {
        storeService.getAllItems()
            .then(data => {
                if (data.length > 0) {
                    res.render("items", { items: data });
                } else {
                    res.render("items", { message: "No results found" });
                }
            })
            .catch(err => {
                res.render("items", { message: "Error fetching items: " + err });
            });
    }
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => {
            if (data.length > 0) {
                res.render("categories", { categories: data });
            } else {
                res.render("categories", { message: "No results found" });
            }
        })
        .catch(err => {
            res.render("categories", { message: "Error fetching categories: " + err });
        });
});

app.get("/categories/add", (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect("/categories"))
        .catch((err) => res.status(500).send("Error adding category: " + err));
});

app.get("/categories/delete/:id", (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect("/categories"))
        .catch((err) => res.status(500).send("Unable to remove category / Category not found: " + err));
});

app.get("/items/add", (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render("addPost", { categories: categories });
        })
        .catch(err => {
            res.render("addPost", { categories: [] });
        });
});


app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch((err) => {
            console.error("Image upload failed:", err);
            res.status(500).send("Image upload failed");
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        req.body.category = parseInt(req.body.category);

        storeService.addItem(req.body)
            .then(() => res.redirect("/items"))
            .catch((err) => res.status(500).send("Error adding item: " + err));
    }
});

app.get("/item/:id", (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.json(item))
        .catch(err => res.status(500).json({ message: err }));
});

app.get("/items/delete/:id", (req, res) => {
    const id = req.params.id;
    storeService.deletePostById(id)
        .then(() => {
            res.redirect("/items");
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Post / Post not found: " + err);
        });
});

app.get('/shop/:id', async (req, res) => {
    let viewData = {};

    try {
        let item = await storeService.getItemById(req.params.id);
        viewData.item = item;
    } catch (err) {
        viewData.message = "No results found";
    }

    try {
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories found";
    }

    try {
        let items = await storeService.getPublishedItemsByCategory(req.query.category);
        viewData.items = items;
    } catch (err) {
        viewData.itemsMessage = "No items found in this category";
    }
    res.render("shop", { data: viewData });
});


app.use((req, res) => {
    res.status(404).render("404");
});


storeService.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log(`Express http server listening on ${HTTP_PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize store service:", err);
});