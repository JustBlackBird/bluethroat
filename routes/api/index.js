var Router = require('express').Router,
    radio = require('./radio'),
    alarm = require('./alarm'),
    bodyParser = require('body-parser');

/**
 * Initialize API routes.
 *
 * @param {Application} app Server side application instance.
 * @returns {Object} Express router instance.
 */
module.exports = function(app) {
    var router = Router();

    router.use('/', bodyParser.json());
    router.use('/radio', radio(app.getRadio(), app.getStationsKeeper()));
    router.use('/alarm', alarm(app.getAlarm(), app.getSettings()));

    return router;
};