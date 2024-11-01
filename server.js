/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
*
*  Name: Kim Khoa Nguyen - Student ID: 104574231 Date: November 1st, 2024
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

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
    cloud_name: 'dhi2beyvo',
    api_key: '562113892115896',
    api_secret: 'wbUvixmKOFGtC8-i8AxQGqyxJrc',
    secure: true
});

const upload = multer();

app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"));
});

app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then((items) => {
            res.json(items);
        })
        .catch(err => {
            res.status(500).json({ message: err.message });
        });
});

app.get("/items", (req, res) => {
    storeService.getAllItems()
        .then((items) => {
            res.json(items);
        })
        .catch(err => {
            res.status(500).json({ message: err.message });
        });
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then((categories) => {
            res.json(categories);
        })
        .catch(err => {
            res.status(500).json({ message: err.message });
        });
});

app.get("/items/add", (req, res) => {
    res.sendFile(path.join(__dirname, "/views/addItem.html"));
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


app.get("/items", (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ message: err }));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ message: err }));
    } else {
        storeService.getAllItems()
            .then(items => res.json(items))
            .catch(err => res.status(500).json({ message: err }));
    }
});

app.get("/item/:id", (req, res) => {
    storeService.getItemById(req.params.id)
        .then(item => res.json(item))
        .catch(err => res.status(500).json({ message: err }));
});

app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

storeService.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log(`Express http server listening on ${HTTP_PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize store service:", err);
});
