var Router = require('express').Router,
    homeRoute = require('./home.js'),
    playRoute = require('./play.js'),
    stopRoute = require('./stop.js');

/**
 * Initialize application's routes.
 *
 * @param {Radio} radio An instance of Radio.
 * @param {Radio} alarm An instance of AlarmClock.
 * @returns {Object} Express router instance.
 */
module.exports = function(radio, alarm) {
    var router = Router();

    // Initialize all routes, one by one
    router.use(homeRoute(radio, alarm));
    router.use(playRoute(radio));
    router.use(stopRoute(radio));

    return router;
}
