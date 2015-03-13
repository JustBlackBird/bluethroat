var express = require('express'),
    homeRoute = require('./home.js'),
    playRoute = require('./play.js'),
    stopRoute = require('./stop.js');

/**
 * Initialize application's routes.
 *
 * @param {Radio} radio An instance of Radio.
 * @param {Radio} alarm An instance of AlarmClock.
 * @returns {Object} Express application instance.
 */
module.exports = function(radio, alarm) {
    var app = express();

    // Initialize all routes, one by one
    app.use(homeRoute(radio, alarm));
    app.use(playRoute(radio));
    app.use(stopRoute(radio));

    return app;
}
