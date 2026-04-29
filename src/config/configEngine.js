const express = require('express');
const path = require('path');

const configViewEngine = (app) => {
    app.use(express.static(path.join(__dirname,'../public')));
    app.use(express.static(path.join(__dirname,'../../uploads')));
    app.set('view engine', "ejs");
    app.set('views', path.join(__dirname,'../views'));
}

module.exports = configViewEngine;
