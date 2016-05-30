var Router = require('express').Router,
    Promise = require('bluebird');

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

    return Promise.all([
        app.getStationsKeeper().all().then(function(stations) {
            state.stations = stations;
        }),
        app.getRadio().isPlaying().then(function(isPlaying) {
            if (!isPlaying) {
                state.currentStation = false;
            }
        }),
        new Promise(function(resolve, reject) {
            app.getSettings().get('alarm_station', function(err, station) {
                if (err) {
                    return reject(err);
                }

                state.alarmSettings.selectedStation = station || false;
                resolve();
            });
        })
    ]).then(function() {
        return state;
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
        extractApplicationState(app).then(function(state) {
            // Render the page
            res.render('index', {
                applicationState: JSON.stringify(state)
            });
        }).catch(function(err) {
            next(err);
        });
    });

    return router;
};
