var Router = require('express').Router,
    async = require('async');

/**
 * Extract client side appication state from server side application instance.
 *
 * @param {Application} app Server-side application.
 * @param {Function} callback A function which will be called once the state is
 * extracted. The first argument will be set to error object (or null) and the
 * second argument will be set to state object.
 */
var extractApplicationState = function(app, callback) {
    var alarm = app.getAlarm(),
        alarmTime = alarm.getTime();

    var state = {
        currentStation: app.getRadio().getCurrentStation().id,
        stations: [],
        alarmSettings: {
            selectedStation: false,
            isEnabled: alarm.isRunning(),
            time: {
                hours: parseInt(alarmTime.hours),
                minutes: parseInt(alarmTime.minutes)
            }
        }
    };

    async.parallel([
        function(cb) {
            app.getStationsKeeper().all(function(err, stations) {
                if (err) {
                    return cb(err);
                }

                state.stations = stations;

                cb(null);
            });
        },
        function(cb) {
            app.getRadio().isPlaying(function(err, isPlaying) {
                if (err) {
                    return cb(err);
                }

                if (!isPlaying) {
                    state.currentStation = false;
                }

                cb(null);
            });
        },
        function(cb) {
            app.getSettings().get('alarm_station', function(err, station) {
                if (err) {
                    return cb(err);
                }

                state.alarmSettings.selectedStation = station || false;
                cb(null);
            });
        }
    ], function(err) {
        if (err) {
            return callback(err);
        }

        callback(null, state);
    });
};

/**
 * Initializes route for the home page.
 *
 * @param {Application} app Server side application instance.
 * @returns {Object} Express router instance.
 */
module.exports = function(app) {
    var router = Router();

    // Register routes
    router.get('/', function(req, res, next) {
        extractApplicationState(app, function(err, state) {
            if (err) {
                return next(err);
            }

            // Render the page
            res.render('index', {
                applicationState: JSON.stringify(state)
            });
        });
    });

    return router;
};
