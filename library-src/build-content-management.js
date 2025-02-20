// basic build

'use strict';

//-----------------------------------------
// PLUGINs
//-----------------------------------------
var path        = require('path'),
    Handlebars  = require('handlebars'),
    Metalsmith  = require('metalsmith'),
    assets      = require('metalsmith-assets'),
    collections = require('metalsmith-collections'),
    fileMetadata= require('metalsmith-filemetadata'),
    headings    = require('metalsmith-headings'),
    headingsidentifier = require("metalsmith-headings-identifier"),
    layouts     = require('metalsmith-layouts'),
    markdown    = require('metalsmith-markdown'),
    navigation  = require('metalsmith-navigation'),
    permalinks  = require('metalsmith-permalinks'),
    slug        = require('metalsmith-slug')

//-----------------------------------------
// Navigation Settings
//-----------------------------------------
var navConfigs = {
    primary:{
        sortBy: 'nav_sort',
        filterProperty: 'nav_groups',
        includeDirs: true
    },
    library: {
        sortBy: 'nav_sort',
        filterProperty: 'nav_groups',
        includeDirs: true
    }
};

var navSettings = {
    navListProperty: 'navs',
    permalinks: true,
};

var navTask = navigation(navConfigs, navSettings);

//-----------------------------------------
// REGISTER HANDLEBARS HELPERS
//-----------------------------------------
var relativePathHelper = function(current, target) {
    // normalize and remove starting slash from path
    if(!current || !target){
        return '';
    }
    current = path.normalize(current).slice(0);
    target = path.normalize(target).slice(0);
    current = path.dirname(current);
    return path.relative(current, target).replace(/\\/g, '/');
};

Handlebars.registerHelper('relative_path', relativePathHelper);

// comparitor for if statements
Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('lowerCaseHyphenate', function(str) {
  return str.toLowerCase().split(" ").join("-");
});

//-----------------------------------------
// METALSMITH BUILD CONFIG
//-----------------------------------------
var ms = Metalsmith(__dirname) // the working directory
    .clean(true)             // clean the build directory
    .source('./html/content-management')     // the page source directory

    // Create collections
    .use(collections({
        "categories": {
            pattern: "*/index.md",
            sortBy: "nav_sort"
        },
        "pages": {
            pattern: "*/pages/*.md",
            sortBy: "nav_sort"
        }
    }))

    // Convert Markdown to HTML
    .use(markdown({
        smartypants: true,
        smartLists: true,
        gfm: true,
        tables: true
    }))

    .use(fileMetadata([
        {
            pattern: "**",
            metadata: {"library": "content-management"}
        },
        {
            pattern: "*",
            metadata: {"layout": "library-landing.hbt"}
        },
        {
            pattern: "*/*",
            metadata: {"layout": "category-page.hbt", "nav_groups": "primary"}
        },
        {
            pattern: "*/pages/*",
            metadata: {"layout": "page.hbt", "nav_groups": "primary"}
        }
    ]))

    .use(headings('h2'))

    .use(headingsidentifier(

    ))

    .use(slug({
      property: 'category',
      lower: true,
      replacement: ' '
    }))

    // Set filestructure using permalinks for nice urls
    .use(permalinks({
        linksets: [{
            match: { collection: 'pages' },
            pattern: ":category/:title"
        }]
    }))

    //.use(filePathTask)

    // Create Navigation
    .use(navTask)

    .use(layouts({
        engine: "handlebars",
        directory: "./templates",
        partials: "./templates/partials"
    }))


    .use(assets({
        source: "./assets",
        destination: "../assets"
    }))

    .destination('../library/content-management')   // the destination directory

    .build(function(err) {   // build the site
        if (err) throw err;    // and throw errors
        console.log('...complete')
    })
