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
     * Indicates if radio is playing now.
     *
     * @type {Boolean}
     * @private
     */
    this._isPlaying = false;

    /**
     * Machine name of the currently used radio station
     * @type String
     * @private
     */
    this._currentStation = null;

    // Attach events to handle MPD connection status changes.
    this._mpdPool.on('connect', this._onMpdConnect.bind(this));
    this._mpdPool.once('connect', this._onMpdFirstConnect.bind(this));
    this._mpdPool.on('disconnect', this._onMpdDisconnect.bind(this));
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
    if (!this._currentStation) {
        return callback(new Error('You should choose a station before play it.'));
    }

    // Get URL of the audio stream
    var url = this._currentStation.url,
        self = this,
        done = callback || noop;

    // Play the sound
    this._mpdPool.getClient(function(err, client) {
        if (err) {
            // TODO: Use external logger instead of console.
            console.error(err);

            return done(err);
        }

        client.sendCommands(
            [
                mpd.cmd('add', [url]),
                mpd.cmd('play', [])
            ],
            function(err) {
                self._isPlaying = true;
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
    var self = this,
        done = callback || noop;

    this._mpdPool.getClient(function(err, client) {
        if (err) {
            // TODO: Use external logger instead of console.
            console.error(err);

            return done(err);
        }

        client.sendCommands(
            [
                mpd.cmd('stop', []),
                mpd.cmd('clear', [])
            ],
            function(err) {
                self._isPlaying = false;
                done(err || null);
            }
        );
    });
};

/**
 * Plays an audio stream from the specified radio station and gradually increase
 * volume from 0% to 100%.
 *
 * @param {Function} callback A function which will be called at the end of fade
 * in process. If something is wrong the first argument will be set to error
 * object. Otherwise it will be set to null.
 */
Radio.prototype.fadeIn = function(callback) {
    var self = this,
        done = callback || noop;

    this._mpdPool.getClient(function(err, client) {
        if (err) {
            // TODO: Use external logger instead of console
            console.error(err);

            return done(err);
        }

        // Set volume to 0% before play the sound
        client.sendCommand(
            mpd.cmd('setvol', [0]),
            function() {
                // Turn the radio on
                self.play(function(err) {
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
                        0.5 * 1000
                    );
                });
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
 * @returns {Boolean} true if sound is playing and false otherwise.
 */
Radio.prototype.isPlaying = function() {
    return this._isPlaying;
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
            'The following keys are missed at station object: "%s"',
            missedKeys.join('", "')
        ));
    }

    this._currentStation = station;
};

/**
 * An event listener that is called when a connection to MPD server is
 * established.
 *
 * @param {MpdClient} mpdClient A client that represents the new connection.
 * @private
 */
Radio.prototype._onMpdConnect = function(mpdClient) {
    var self = this;

    // Update internal "playing" value when mpd state changed
    mpdClient.on('system-player', function() {
        mpdClient.sendCommand(mpd.cmd('status', []), function(err, msg) {
            if (err) {
                throw err;
            }

            var status = mpd.parseKeyValueMessage(msg);
            // Update the internal state
            self._isPlaying = (status.state === 'play');
        });
    });
};

/**
 * An event listener that is called when the first connection to MPD server is
 * established.
 *
 * @param {MpdClient} mpdClient A client that represents the new connection.
 * @private
 */
Radio.prototype._onMpdFirstConnect = function(mpdClient) {
    var self = this;

    mpdClient.once('ready', function () {
        // Set volume to 100% by default when the radio is initialized.
        mpdClient.sendCommand(mpd.cmd('setvol', [100]));
        // Let the other world know that the radio is up and running.
        self.emit('ready');
    });
};

/**
 * An event listener that is called when a connection to MPD server is died.
 *
 * @param {MpdClient} mpdClient A client that represents the died connection.
 * @private
 */
Radio.prototype._onMpdDisconnect = function(mpdClient) {
    this._isPlaying = false;
};

module.exports = Radio;
