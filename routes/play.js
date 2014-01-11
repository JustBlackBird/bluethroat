/**
 * Initialize '/play' route.
 *
 * @param {Object} app Express application object
 */
exports.init = function(app) {
    app.get('/play', function(req, res, next) {
        // Play currently selected radio station
        app.radio.play();

        // Redirect a user to home page
        res.redirect('/');
    });
}
