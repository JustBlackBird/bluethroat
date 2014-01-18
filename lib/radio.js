var mpd = require('mpd');

/**
 * An abstraction for internet radio receiver
 *
 * @class Radio
 * @param {Object} config Instance configuration. Can contain the following
 * properties:
 *   - mpdHost: MPD server host.
 *   - mpdPort: MPD server port.
 *   - stations: An object which properties are radio stations machine
 *     names and values are objects describing radio stations. Each radion
 *     station has "name" property for human readable name and "url" property
 *     for the station's audio stream URL.
 *   - defaultStation: machine name of the radio station which is used by
 *     default.
 * @param {Function} callback A function that should be called after an instance
 * is completely initialized.
 * @returns {Radio}
 */
module.exports = function(config, callback) {
    // Validate "mpdHost" and "mpdPort" configurartion params
    if (!config.mpdPort || !config.mpdHost) {
        throw new Error("You must specify MPD host and port");
    }

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
    var availableStations = config.stations || {};

    /**
     * Machine name of the currently used radio station
     * @type String
     * @private
     */
    var currentStation = config.defaultStation || firstStation || null;

    /**
     * An instance of MPD client
     * @type MpdClient
     * @private
     */
    var mpdClient = mpd.connect({
        host: config.mpdHost,
        port: config.mpdPort
    });

    /**
     * Indicates if radio is playing now
     * TODO: use messages from MPD to determine if sound is playing now
     * @type Boolean
     * @private
     */
    var isPlaying = false;

    /**
     * Play an audio stream from the specified radio station
     *
     * @param {String} Station machine name of a radio station to play. If it
     * does not specified the current radio station will be used.
     */
    this.play = function(station) {
        // Update current radio station if need
        if (station) {
            this.setCurrentStation(station);
        }

        // Get URL of the audio stream
        var s = this.getCurrentStation(),
            url = (this.getAvailableStations())[s].url;

        // Play the sound
        mpdClient.sendCommands(
            [
                mpd.cmd('add', [url]),
                mpd.cmd('play', [])
            ],
            function() {
                isPlaying = true;
            }
        );
    }

    /**
     * Stop playing the sound.
     */
    this.stop = function() {
        mpdClient.sendCommands(
            [
                mpd.cmd('stop', []),
                mpd.cmd('clear', [])
            ],
            function() {
                isPlaying = false;
            }
        );
    }

    /**
     * Play an audio stream from the specified radio station and gradually
     * increase volume from 0% to 100%.
     *
     * @param {String} Station machine name of a radio station to play. If it
     * does not specified the current radio station will be used.
     */
    this.fadeIn = function(station) {
        // Store "this" pointer
        var self = this;

        // Set volume to 0% before play the sound
        mpdClient.sendCommand(
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
                        mpdClient.sendCommand(mpd.cmd('setvol', [currentVolume]));

                        // Stop volume changing on 100%
                        if (currentVolume >= 100) {
                            clearInterval(i);
                        }
                    },
                    0.5 * 1000
                );
            }
        );
    }

    /**
     * Indicate if a sound is currently playing.
     *
     * @returns {Boolean} true if sound is playing and false otherwise.
     */
    this.isPlaying = function() {
        return isPlaying;
    }

    /**
     * Returns the list of available radio stations
     * @returns {Object}
     */
    this.getAvailableStations = function() {
        return availableStations;
    }

    /**
     * Returns machine name of the currently used radio station
     * @returns {String}
     */
    this.getCurrentStation = function() {
        return currentStation;
    }

    /**
     * Set the current radio station
     *
     * @param {String} station Machine name of the radio station
     */
    this.setCurrentStation = function(station) {
        if (!availableStations[station]) {
            throw new Error('There is no such radio station');
        }
        currentStation = station;
    }

    // Set volume to 100% by default when the MPD client will be initialized
    mpdClient.on('ready', function() {
        mpdClient.sendCommand(mpd.cmd('setvol', [100]));

        // Run callback function if it is set
        if (typeof callback === 'function') {
            callback();
        }
    });
}
