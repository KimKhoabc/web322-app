/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Kim Khoa Nguyen
Student ID: 104574231
Date: October 08, 2024
Replit Web App URL: https://replit.com/@kimkhoa0905/web322-app
GitHub Repository URL: https://github.com/KimKhoabc/web322-app

********************************************************************************/

const storeService = require('./store-service');
const express = require('express');
const path = require('path');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("public"));

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
