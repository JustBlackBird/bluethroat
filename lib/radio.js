var util = require('util'),
    mpd = require('mpd'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    EventEmitter = require('events').EventEmitter;

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
 * @return {Promise} A promise which will be resolved once the radio is playing.
 */
Radio.prototype.play = function() {
    if (!this._currentStation) {
        return Promise.reject(new Error('You should choose a station before play it.'));
    }

    // Get URL of the audio stream
    var url = this._currentStation.url;

    // Storing pool in a var is easily than bind all the functions to "this".
    var pool = this._mpdPool;

    return this._mpdPool.getClient().then(function(client) {
        return new Promise(function(resolve, reject) {
            // Play the sound
            client.sendCommands(
                [
                    mpd.cmd('clear', []),
                    mpd.cmd('setvol', [100]),
                    mpd.cmd('add', [url]),
                    mpd.cmd('play', [])
                ],
                function(err) {
                    pool.releaseClient(client);

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    });
};

/**
 * Stops playing the sound.
 *
 * @param {Function} callback A function which will be called once the radio is
 * stopped. If something went wrong the first argument will be set to error
 * object. Otherwise it will be set to null.
 */
Radio.prototype.stop = function() {
    // Storing pool in a var is easily than bind all the functions to "this".
    var pool = this._mpdPool;

    return this._mpdPool.getClient().then(function(client) {
        return new Promise(function(resolve, reject) {
            client.sendCommands(
                [
                    mpd.cmd('stop', []),
                    mpd.cmd('clear', [])
                ],
                function(err) {
                    pool.releaseClient(client);

                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    });
};

/**
 * Plays an audio stream from the specified radio station and gradually increase
 * volume from 0% to 100%.
 *
 * @param {Number} duration Time in milliseconds fade in process should goes on.
 * Be aware, that this value must be greater than 100 milliseconds.
 * @returns {Promise} A promise which will be resolved once the radio is done
 * with fade in.
 */
Radio.prototype.fadeIn = function(duration) {
    if (!this._currentStation) {
        return Promise.reject(new Error('You should choose a station before play it.'));
    }

    var url = this._currentStation.url,
        _duration = (typeof duration === 'undefined') ? (50 * 1000) : duration;

    if (_duration < 100) {
        return Promise.reject(new Error('Duration must be greater than or equal to 100'));
    }

    // Storing pool in a var is easily than bind all the functions to "this".
    var pool = this._mpdPool;

    return this._mpdPool.getClient().then(function(client) {
        return new Promise(function(resolve, reject) {
            // Set volume to 0% before play the sound
            client.sendCommands(
                [
                    mpd.cmd('setvol', [0]),
                    mpd.cmd('add', [url]),
                    mpd.cmd('play', [])
                ],
                function(err) {
                    if (err) {
                        pool.releaseClient(client);

                        return reject(err);
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
                                pool.releaseClient(client);
                                resolve(null);
                            }
                        },
                        Math.round(_duration / 100)
                    );
                }
            );
        });
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
 * @returns {Promise} A promise which will be resolved with boolean play state
 * or will be rejected on error.
 */
Radio.prototype.isPlaying = function() {
    // Storing pool in a var is easily than bind all the functions to "this".
    var pool = this._mpdPool;

    return this._mpdPool.getClient().then(function(client) {
        return new Promise(function(resolve, reject) {
            client.sendCommand(mpd.cmd('status', []), function(err, msg) {
                pool.releaseClient(client);

                if (err) {
                    return reject(err);
                }

                var status = mpd.parseKeyValueMessage(msg);
                resolve(status.state === 'play');
            });
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
