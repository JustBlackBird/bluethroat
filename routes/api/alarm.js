var Router = require('express').Router,
    _ = require('lodash'),
    Promise = require('bluebird');

/**
 * Validate passed in data to make sure all values are passed and that they
 * are valid.
 *
 * @param {Object} data Data to validate.
 * @returns {String|Boolean} Error string or boolean false if the data is valid.
 */
var validateSettingsData = function(data) {
    if (typeof data.isEnabled !== 'boolean') {
        return '"isEnabled" field must be set.';
    }

    if (!data.time) {
        return '"time" field cannot be empty.';
    }

    if (!_.isInteger(data.time.hours) || data.time.hours < 0 || data.time.hours > 23) {
        return '"time.hours" must be an integer in [0, 23] interval.';
    }

    if (!_.isInteger(data.time.minutes) || data.time.minutes < 0 || data.time.minutes > 59) {
        return '"time.minutes" must be an integer in [0, 59] interval.';
    }

    if (typeof data.selectedStation !== 'string' || data.selectedStation.length === 0) {
        return '"selectedStation" must be a non empty string.';
    }

    return false;
};

/**
 * Initialize API routes for alarm clock settings manipulation.
 *
 * @param {AlarmClock} alarm An instance of the Alarm Clock.
 * @param {Settings} settings An instance of Settings.
 * @returns {Object} Express router instance.
 */
module.exports = function(alarm, settings) {
    var router = Router();

    router.put('/settings', function(req, res, next) {
        var data = req.body,
            validationError = validateSettingsData(data);

        if (validationError) {
            return req.status(400).json({
                error: validationError
            });
        }

        alarm.setTime(data.time.hours, data.time.minutes);
        if (data.isEnabled) {
            alarm.run();
        } else {
            alarm.stop();
        }

        Promise.all([
            settings.set('alarm_time', _.extend({}, data.time, {seconds: 0})),
            settings.set('alarm_enabled', data.isEnabled),
            settings.set('alarm_station', data.selectedStation)
        ]).then(function() {
            res.status(200).json({});
        }).catch(function(error) {
            next(error);
        });
    });

    return router;
};
