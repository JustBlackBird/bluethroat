/**
 * Initialize alarm clock.
 *
 * @param {Object} app Express application object
 */
exports.init = function(app) {
    // Check current time each 45 seconds and turn on the radio when time is came
    setInterval(function() {
        var currentDate = new Date();
        if (
            app.enabled('alarm')
            && currentDate.getHours() === app.get('wake up hour')
            && currentDate.getMinutes() === app.get('wake up minute')
            && !app.radio.isPlaying()
        ) {
            // Time to wake up. Turn on the radio
            app.radio.fadeIn();
        }
    }, 45 * 1000);
}
