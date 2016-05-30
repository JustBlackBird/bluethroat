var Promise = require('bluebird');

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
 * @returns {Promise} A promise which will be resolved once the app is started.
 */
Application.prototype.run = function() {
    if (this._isRunning) {
        return Promise.reject(new Error('The application is already running.'));
    }

    this._isRunning = true;

    this._alarm.on('ring', function() {
        // Make sure the radio is switched off.
        this._radio.isPlaying().then(function(isPlaying) {
            if (isPlaying) {
                // The radio is playing now. Do nothing.
                return Promise.resolve();
            }

            // Play the radio
            return this._getAlarmStation().then(function(station) {
                this._radio.setCurrentStation(station);

                return this._radio.fadeIn();
            }.bind(this));
        }.bind(this)).catch(function(err) {
            console.error(err);
        });
    }.bind(this));

    // Get the current alarm time from the storage.
    return this._getSettingsField('alarm_time').then(function(time) {
        if (time) {
            this._alarm.setTime(time.hours, time.minutes);
        } else {
            // There is no alarm time stored. Use a default one.
            this._alarm.setTime(9, 45);
        }
    }.bind(this)).then(function() {
        // Get the current state of alarm clock.
        return this._getSettingsField('alarm_enabled');
    }.bind(this)).then(function(isEnabled) {
        if (isEnabled) {
            this._alarm.run();
        }
    }.bind(this));
};

Application.prototype._getAlarmStation = function() {
    return new Promise(function(resolve, reject) {
        this._settings.get('alarm_station', function(err, stationId) {
            if (err) {
                reject(err);
            } else {
                resolve(stationId);
            }
        });
    }.bind(this)).then(function(stationId) {
        return this._stationsKeeper.get(stationId);
    }.bind(this));
};

Application.prototype._getSettingsField = function(field) {
    return new Promise(function(resolve, reject) {
        this._settings.get(field, function(err, value) {
            if (err) {
                reject(err);
            } else {
                resolve(value);
            }
        });
    }.bind(this));
};

module.exports = Application;
