var homeRoute = require('./home.js'),
    playRoute = require('./play.js'),
    stopRoute = require('./stop.js');

/**
 * Initialize application's routes.
 *
 * @param {Object} app Express application object
 */
exports.init = function(app) {
    // Initialize all routes, one by one
    homeRoute.init(app);
    playRoute.init(app);
    stopRoute.init(app);
}
