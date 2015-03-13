var express = require('express');

/**
 * Initializes radio play route.
 *
 * @param {Radio} radio An instance of Radio.
 * @returns {Object} Express application instance.
 */
module.exports = function(radio) {
    var app = express();

    app.get('/play', function(req, res, next) {
        // Play currently selected radio station
        radio.play();

        // Redirect a user to home page
        res.redirect('/');
    });

    return app;
}
