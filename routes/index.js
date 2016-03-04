var Router = require('express').Router,
    homeRouter = require('./home.js'),
    apiRouter = require('./api');

/**
 * Initialize application's routes.
 *
 * @param {Application} app Server side application instance.
 * @returns {Object} Express router instance.
 */
module.exports = function(app) {
    var router = Router();

    // Initialize all routes, one by one
    router.use('/', homeRouter(app));
    router.use('/api', apiRouter(app));

    return router;
};
