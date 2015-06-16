var mpd = require('mpd'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

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
    this.mpdPool = mpdPool;

    /**
     * Indicates if radio is playing now.
     *
     * @type {Boolean}
     * @private
     */
    this.playing = false;

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
    this.availableStations = config.stations || {};

    /**
     * Machine name of the currently used radio station
     * @type String
     * @private
     */
    this.currentStation = config.defaultStation || firstStation || null;

    // Attach events to handle MPD connection status changes.
    this.mpdPool.on('connect', this.onMpdConnect.bind(this));
    this.mpdPool.once('connect', this.onMpdFirstConnect.bind(this));
    this.mpdPool.on('disconnect', this.onMpdDisconnect.bind(this));
};

inherits(Radio, EventEmitter);

/**
 * Plays an audio stream from the specified radio station
 *
 * @param {String} station machine name of a radio station to play. If it does
 * not specified the current radio station will be used.
 */
Radio.prototype.play = function(station) {
    // Update current radio station if need
    if (station) {
        this.setCurrentStation(station);
    }

    // Get URL of the audio stream
    var s = this.getCurrentStation(),
        url = (this.getAvailableStations())[s].url,
        self = this;

    // Play the sound
    this.getMpdClient(function(client) {
        client.sendCommands(
            [
                mpd.cmd('add', [url]),
                mpd.cmd('play', [])
            ],
            function() {
                self.playing = true;
            }
        );
    });
};

/**
 * Stops playing the sound.
 */
Radio.prototype.stop = function() {
    var self = this;

    this.getMpdClient(function(client) {
        client.sendCommands(
            [
                mpd.cmd('stop', []),
                mpd.cmd('clear', [])
            ],
            function() {
                self.playing = false;
            }
        );
    });
};

/**
 * Plays an audio stream from the specified radio station and gradually increase
 * volume from 0% to 100%.
 *
 * @param {String} station machine name of a radio station to play. If it does
 * not specified the current radio station will be used.
 */
Radio.prototype.fadeIn = function(station) {
    var self = this;

    this.getMpdClient(function(client) {
        // Set volume to 0% before play the sound
        client.sendCommand(
            mpd.cmd('setvol', [0]),
            function() {
                // Turn the radio on
                self.play(station);

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
                        }
                    },
                    0.5 * 1000
                );
            }
        );
    });
};

/**
 * Returns the list of available radio stations.
 * @returns {Object}
 */
Radio.prototype.getAvailableStations = function() {
    return this.availableStations;
};

/**
 * Returns machine name of the currently used radio station.
 * @returns {String}
 */
Radio.prototype.getCurrentStation = function() {
    return this.currentStation;
};

/**
 * Indicates if a sound is currently playing.
 *
 * @returns {Boolean} true if sound is playing and false otherwise.
 */
Radio.prototype.isPlaying = function() {
    return this.playing;
};

/**
 * Sets the current radio station.
 *
 * @param {String} station Machine name of the radio station
 */
Radio.prototype.setCurrentStation = function(station) {
    if (!this.availableStations[station]) {
        throw new Error('There is no such radio station');
    }
    this.currentStation = station;
};

/**
 * Returns MPD client with alive connection.
 *
 * @param {Function} cb A callback that will be called when the client is
 * ready. A MpdClient instance will be passed as the first argument to the
 * callback.
 */
Radio.prototype.getMpdClient = function(cb) {
    var client = this.mpdPool.getClient();

    if (client) {
        // Connection to MPD is alive. Just return the client via callback.
        cb(client);

        return;
    }

    this.mpdPool.once('connect', function(client) {
        client.once('ready', function() {
            cb(client);
        });
    });
};

/**
 * An event listener that is called when a connection to MPD server is
 * established.
 *
 * @param {MpdClient} mpdClient A client that represents the new connection.
 * @private
 */
Radio.prototype.onMpdConnect = function(mpdClient) {
    var self = this;

    // Update internal "playing" value when mpd state changed
    mpdClient.on('system-player', function() {
        mpdClient.sendCommand(mpd.cmd('status', []), function(err, msg) {
            if (err) {
                throw err;
            }

            var status = mpd.parseKeyValueMessage(msg);
            // Update the internal state
            self.playing = (status.state === 'play');
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
Radio.prototype.onMpdFirstConnect = function(mpdClient) {
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
Radio.prototype.onMpdDisconnect = function(mpdClient) {
    this.playing = false;
};

module.exports = Radio;
