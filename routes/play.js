var Router = require('express').Router;

/**
 * Initializes radio play route.
 *
 * @param {Radio} radio An instance of Radio.
 * @returns {Object} Express router instance.
 */
module.exports = function(radio) {
    var router = Router();

    router.get('/play', function(req, res, next) {
        // Play currently selected radio station
        radio.play(null, function(err) {
            if (err) {
                return next(err);
            }

            // Redirect a user to home page
            res.redirect('/');
        });
    });

    return router;
}
