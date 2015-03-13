var express = require('express');

/**
 * Initialize radio stop route.
 *
 * @param {Radio} radio An instance of Radio.
 * @returns {Object} Express application instance.
 */
module.exports = function(radio) {
    var app = express();

    app.get('/stop', function(req, res) {
        // Just stop the sound
        radio.stop();

        // Redirect a user to home page
        res.redirect('/');
    });

    return app;
}
