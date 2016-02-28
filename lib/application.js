var async = require('async');

/**
 * Represents whole backend application.
 *
 * @param {Radio} radio
 * @param {AlarmClock} alarm
 * @param {RadioStationsKeeper} stationsKeeper
 * @param {Settings} settings
 */
var Application = function(radio, stationsKeeper, alarm, settings) {
    /**
     * @type Radio
     * @private
     */
    this._radio = radio;
    /**
     * @type RadioStationsKeeper
     * @private
     */
    this._stationsKeeper = stationsKeeper;
    /**
     * @type AlarmClock
     * @private
     */
    this._alarm = alarm;
    /**
     * @type Settings
     * @private
     */
    this._settings = settings;

    /**
     * Indicates if the application is already running.
     *
     * @type Boolean
     * @private
     */
    this._isRunning = false;
};

/**
 * Retrieves alarm clock used in the application.
 *
 * @returns {Radio}
 */
Application.prototype.getRadio = function() {
    return this._radio;
};

/**
 * Retireves stations keeper used in the application.
 *
 * @returns {RadioStationsKeeper}
 */
Application.prototype.getStationsKeeper = function() {
    return this._stationsKeeper;
};

/**
 * Retrieves alarm clock used in the applicaion.
 *
 * @returns {AlarmClock}
 */
Application.prototype.getAlarm = function() {
    return this._alarm;
};

/**
 * Retrieves settings storage used in the applicaion.
 *
 * @returns {Settings}
 */
Application.prototype.getSettings = function() {
    return this._settings;
};

/**
 * Initialize referencies between internal objects and runs the app.
 *
 * @param {Function} callback A function which will be called once the
 * application is ready. On error the first argument will be set to error
 * object.
 */
Application.prototype.run = function(callback) {
    if (this._isRunning) {
        return callback(new Error('The application is already running.'));
    }

    this._isRunning = true;

    this._alarm.on('ring', (function() {
        if (!this._radio.isPlaying()) {
            // Time to wake up. Turn on the radio
            this._radio.fadeIn();
        }
    }).bind(this));

    async.series([
        (function(cb) {
            // Get the current alarm time from the storage.
            this._settings.get('alarm_time', (function(error, time) {
                if (error) {
                    return cb(error);
                }

                if (time) {
                    this._alarm.setTime(time.hours, time.minutes);
                } else {
                    // There is no alarm time stored. Use a default one.
                    this._alarm.setTime(9, 45);
                }

                cb(null);
            }).bind(this));
        }).bind(this),
        (function(cb) {
            // Get the current state of alarm clock.
            this._settings.get('alarm_enabled', function(error, isEnabled) {
                if (error) {
                    return cb(error);
                }

                if (isEnabled) {
                    this._alarm.run();
                }

                cb(null);
            });
        }).bind(this)
    ], function(error) {
        callback(error || null);
    });
};

module.exports = Application;
