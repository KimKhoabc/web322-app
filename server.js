/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
*
*  Name: Kim Khoa Nguyen - Student ID: 104574231 Date: November 22st, 2024
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
const Handlebars = require('handlebars'); 

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

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

const handlebars = exphbs.create({
    helpers: {
        safeHTML: function(content) {
            return new Handlebars.SafeString(content);  // <-- Use Handlebars.SafeString
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
    extname: '.hbs'
});

  app.engine('.hbs', handlebars.engine);
  app.set('view engine', '.hbs');


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
            // Fetch items by category if category is specified in the query
            items = await storeService.getPublishedItemsByCategory(req.query.category);
        } else {
            // Fetch all published items if no category is specified
            items = await storeService.getPublishedItems();
        }
        
        // Sort items by postDate (latest first)
        items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

        // Get the first item to display as the main item
        let item = items[0];
        
        // Assign items and item data to viewData
        viewData.items = items;
        viewData.item = item; // Main item
    } catch (err) {
        viewData.message = "No results found";
    }

    try {
        // Get categories
        let categories = await storeService.getCategories();
        viewData.categories = categories;
    } catch (err) {
        viewData.categoriesMessage = "No categories found";
    }

    console.log(viewData);  // Debugging to check what data is being passed

    // Render the 'shop' view with the viewData
    res.render("shop", { data: viewData });
});


app.get("/items", (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(data => res.render("items", { items: data }))
            .catch(err => res.render("items", { message: "no results" }));
    } else {
        storeService.getAllItems()
            .then(data => res.render("items", { items: data }))
            .catch(err => res.render("items", { message: "no results" }));
    }
});


app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => res.render("categories", { categories: data }))
        .catch(err => res.render("categories", { message: "no results" }));
});


app.get("/items/add", (req, res) => {
    res.render("addPost");
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


app.get('/shop/:id', async (req, res) => {

    // Declare an object to store properties for the view
    let viewData = {};
  
    try{
  
        // declare empty array to hold "item" objects
        let items = [];
  
        // if there's a "category" query, filter the returned items by category
        if(req.query.category){
            // Obtain the published "items" by category
            items = await itemData.getPublishedItemsByCategory(req.query.category);
        }else{
            // Obtain the published "items"
            items = await itemData.getPublishedItems();
        }
  
        // sort the published items by itemDate
        items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));
  
        // store the "items" and "item" data in the viewData object (to be passed to the view)
        viewData.items = items;
  
    }catch(err){
        viewData.message = "no results";
    }
  
    try{
        // Obtain the item by "id"
        viewData.item = await itemData.getItemById(req.params.id);
    }catch(err){
        viewData.message = "no results"; 
    }
  
    try{
        // Obtain the full list of "categories"
        let categories = await itemData.getCategories();
  
        // store the "categories" data in the viewData object (to be passed to the view)
        viewData.categories = categories;
    }catch(err){
        viewData.categoriesMessage = "no results"
    }
  
    // render the "shop" view with all of the data (viewData)
    res.render("shop", {data: viewData})
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