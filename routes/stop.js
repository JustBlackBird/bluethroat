/**
 * Initialize '/stop' route.
 *
 * @param {Object} app Express application object
 */
exports.init = function(app) {
    app.get('/stop', function(req, res) {
        // Just stop the sound
        app.radio.stop();

        // Redirect a user to home page
        res.redirect('/');
    });
}
