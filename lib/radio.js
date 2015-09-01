var mpd = require('mpd'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

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
 * @param {Object} config Instance configuration. Can contain the following
 * properties:
 *   - stations: An object which properties are radio stations machine
 *     names and values are objects describing radio stations. Each radion
 *     station has "name" property for human readable name and "url" property
 *     for the station's audio stream URL.
 *   - defaultStation: machine name of the radio station which is used by
 *     default.
 * @returns {Radio}
 */
var Radio = function(mpdPool, config) {
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

    // Validate "stations" configuration param and try to get machine name
    // of the first radio station
    var firstStation;
    for(var index in config.stations) {
        if (config.stations.hasOwnProperty(index)) {
            if (
                !config.stations[index].name
                || !config.stations[index].url
            ) {
                throw new Error('Wrong defenition of the "' + index + '" radio station');
            }
            if (!firstStation) {
                firstStation = index;
            }
        }
    }

    /**
     * List of available radio stations
     * @type Object
     * @private
     */
    this._availableStations = config.stations || {};

    /**
     * Machine name of the currently used radio station
     * @type String
     * @private
     */
    this._currentStation = config.defaultStation || firstStation || null;

    // Attach events to handle MPD connection status changes.
    this._mpdPool.on('connect', this._onMpdConnect.bind(this));
    this._mpdPool.once('connect', this._onMpdFirstConnect.bind(this));
    this._mpdPool.on('disconnect', this._onMpdDisconnect.bind(this));
};

inherits(Radio, EventEmitter);

/**
 * Plays an audio stream from the specified radio station
 *
 * @param {Function} callback A function which will be called once the radio is
 * started to play. If something went wrong the first argument will be set to
 * error object. Otherwise it will be set to null.
 */
Radio.prototype.play = function(callback) {
    // Get URL of the audio stream
    var s = this.getCurrentStation(),
        url = (this.getAvailableStations())[s].url,
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
 * Returns the list of available radio stations.
 * @returns {Object}
 */
Radio.prototype.getAvailableStations = function() {
    return this._availableStations;
};

/**
 * Returns machine name of the currently used radio station.
 * @returns {String}
 */
Radio.prototype.getCurrentStation = function() {
    return this._currentStation;
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
 * @param {String} station Machine name of the radio station
 */
Radio.prototype.setCurrentStation = function(station) {
    if (!this._availableStations[station]) {
        throw new Error('There is no such radio station');
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
