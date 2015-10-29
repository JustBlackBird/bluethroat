var util = require('util'),
    mpd = require('mpd'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter;

/**
 * This function does nothing.
 *
 * It's here to be used as a default callback.
 */
var noop = function() {};

/**
 * An abstraction for internet radio receiver.
 *
 * @param {MpdPool} mpdPool An instance of MPD pool which keeps the connection
 * to MPD server alive.
 * @returns {Radio}
 */
var Radio = function(mpdPool) {
    EventEmitter.call(this);

    /**
     * An instance of MPD pool.
     *
     * @type {MpdPool}
     * @private
     */
    this._mpdPool = mpdPool;

    /**
     * Machine name of the currently used radio station
     * @type String
     * @private
     */
    this._currentStation = null;
};

util.inherits(Radio, EventEmitter);

/**
 * Plays an audio stream from the specified radio station
 *
 * @param {Function} callback A function which will be called once the radio is
 * started to play. If something went wrong the first argument will be set to
 * error object. Otherwise it will be set to null.
 */
Radio.prototype.play = function(callback) {
    // Make sure the callback can be invoked.
    var done = callback || noop;

    if (!this._currentStation) {
        return done(new Error('You should choose a station before play it.'));
    }

    // Get URL of the audio stream
    var url = this._currentStation.url;

    // Play the sound
    this._mpdPool.getClient(function(err, client) {
        if (err) {
            // TODO: Use external logger here
            return done(err);
        }

        client.sendCommands(
            [
                mpd.cmd('setvol', [100]),
                mpd.cmd('add', [url]),
                mpd.cmd('play', [])
            ],
            function(err) {
                done(err || null);
            }
        );
    });
};

/**
 * Stops playing the sound.
 *
 * @param {Function} callback A function which will be called once the radio is
 * stopped. If something went wrong the first argument will be set to error
 * object. Otherwise it will be set to null.
 */
Radio.prototype.stop = function(callback) {
    // Make sure the callback can be invoked.
    var done = callback || noop;

    this._mpdPool.getClient(function(err, client) {
        if (err) {
            // TODO: Use external logger here
            return done(err);
        }

        client.sendCommands(
            [
                mpd.cmd('stop', []),
                mpd.cmd('clear', [])
            ],
            function(err) {
                done(err || null);
            }
        );
    });
};

/**
 * Plays an audio stream from the specified radio station and gradually increase
 * volume from 0% to 100%.
 *
 * @param {Number} duration Time in milliseconds fade in process should goes on.
 * Be aware, that this value must be greater than 100 milliseconds.
 * @param {Function} callback A function which will be called at the end of fade
 * in process. If something is wrong the first argument will be set to error
 * object. Otherwise it will be set to null.
 */
Radio.prototype.fadeIn = function(duration, callback) {
    // Make sure the callback can be invoked.
    var done = callback || noop;

    if (!this._currentStation) {
        return done(new Error('You should choose a station before play it.'));
    }

    var url = this._currentStation.url,
        _duration = (typeof duration === 'undefined') ? (50 * 1000) : duration;

    if (_duration < 100) {
        return done(new Error('Duration must be greater than or equal to 100'));
    }

    this._mpdPool.getClient(function(err, client) {
        if (err) {
            // TODO: Use external logger here
            return done(err);
        }

        // Set volume to 0% before play the sound
        client.sendCommands(
            [
                mpd.cmd('setvol', [0]),
                mpd.cmd('add', [url]),
                mpd.cmd('play', [])
            ],
            function(err) {
                if (err) {
                    return done(err);
                }

                // Iterate over volume level from 0 to 100
                var currentVolume = 0;
                var i = setInterval(
                    function() {
                        // Increase volume by 1%
                        currentVolume += 1;
                        client.sendCommand(mpd.cmd('setvol', [currentVolume]));

                        // Stop volume changing on 100%
                        if (currentVolume >= 100) {
                            clearInterval(i);
                            done(null);
                        }
                    },
                    Math.round(_duration / 100)
                );
            }
        );
    });
};

/**
 * Returns machine name of the currently used radio station.
 * @returns {Object|false} An object the represents radio station. It has the
 * following keys: "id", "name", "url" or boolean false if there is no current
 * station.
 */
Radio.prototype.getCurrentStation = function() {
    return this._currentStation || false;
};

/**
 * Indicates if a sound is currently playing.
 *
 * @param {Function} A function which will be called once the state of the radio
 * will be known. The first argument is an error object (or null) and the second
 * one is boolean that indicates if sound is playong or not.
 */
Radio.prototype.isPlaying = function(callback) {
    // Make sure the callback can be invoked.
    var done = callback || noop;

    this._mpdPool.getClient(function(err, client) {
        if (err) {
            return done(err);
        }

        client.sendCommand(mpd.cmd('status', []), function(err, msg) {
            if (err) {
                return done(err);
            }

            var status = mpd.parseKeyValueMessage(msg);
            done(null, (status.state === 'play'));
        });
    });
};

/**
 * Sets the current radio station.
 *
 * @param {Object} station An object that represents radio station. It must have
 * "id", "name" and "url" keys.
 */
Radio.prototype.setCurrentStation = function(station) {
    var missedKeys = _.difference(['id', 'name', 'url'], Object.keys(station));

    if (missedKeys.length !== 0) {
        throw new Error(util.format(
            'These keys are missed at station object: "%s"',
            missedKeys.join('", "')
        ));
    }

    this._currentStation = station;
};

module.exports = Radio;
