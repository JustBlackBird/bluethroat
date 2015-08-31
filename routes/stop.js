var Router = require('express').Router;

/**
 * Initialize radio stop route.
 *
 * @param {Radio} radio An instance of Radio.
 * @returns {Object} Express application instance.
 */
module.exports = function(radio) {
    var router = Router();

    router.get('/stop', function(req, res, next) {
        // Just stop the sound
        radio.stop(function(err) {
            if (err) {
                return next(err);
            }

            // Redirect a user to home page
            res.redirect('/');
        });
    });

    return router;
}
