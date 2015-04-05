var mpd = require('mpd'),
    _ = require('underscore'),
    inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;

/**
 * Represents wrapper for MPD client that makes sure the its connection is
 * alive.
 *
 * @param {Object} options List of pool objects. It could contains the following
 * keys:
 *  - "host": string, MPD server host to connect to.
 *  - "port": integer, MPD server port to connect to.
 *  - "reconnect": boolean, indicates if connection to MPD server should be
 *    restored when failed. The default value is true.
 *  - "timeout": integer, time in milliseconds after which a reconnection
 *    attempt should be done. The default value is 100.
 * @returns {MpdPool}
 */
var MpdPool = function(options) {
    EventEmitter.call(this);

    /**
     * Options the pool was created with.
     *
     * @type {Object}
     * @private
     */
    this.options = _.defaults(options, {
        reconnect: true,
        timeout: 100
    });

    /**
     * An instance of connected MPD client or null if there is no established
     * connection to MPD server.
     *
     * @type {MpdClient|null}
     * @private
     */
    this.mpdClient = null;

    /**
     * Indicates if the connection to MPD server is alive.
     *
     * @type {Boolean}
     * @private
     */
    this.isConnected = false;

    /**
     * ID of the reconnection timer.
     *
     * This is needed to prevent multiple simultaneous reconnections.
     * @type {Number}
     * @private
     */
    this.reconnectTimeout = null;

    // Initialize the connection.
    this.connect();
}

inherits(MpdPool, EventEmitter);

/**
 * Return MPD client or null if there is no alive connections to MPD server.
 *
 * @returns {MpdClient|null}
 */
MpdPool.prototype.getClient = function() {
    return this.isConnected ? this.mpdClient : null;
}

/**
 * Connects to MPD server.
 *
 * @private
 */
MpdPool.prototype.connect = function() {
    var host = this.options.host,
        port = this.options.port;

    if (this.mpdClient) {
        this.mpdClient.removeAllListeners();
        this.mpdClient = null;
    }

    this.mpdClient = mpd.connect({
        host: host,
        port: port
    });

    this.mpdClient.on('connect', this.onConnect.bind(this));
    this.mpdClient.on('end', this.onDisconnect.bind(this));
    this.mpdClient.on('error', this.onError.bind(this));

    // Reset the reconnection timeout.
    this.reconnectTimeout = null;
}

/**
 * Refresh connection to MPD server if its dropped.
 *
 * Notice that reconnection is disabled on pool level the method will do
 * nothing.
 *
 * @private
 */
MpdPool.prototype.reconnect = function() {
    if (!this.options.reconnect) {
        // We should not try to reconnect to MPD server.
        return;
    }

    if (this.reconnectTimeout) {
        // The reconnection is already requested. Just do nothing and wait for
        // its results.
        return;
    }

    this.reconnectTimeout = setTimeout(this.connect.bind(this), this.options.timeout);
}

/**
 * Event listener that is called then connection to MPD server is established.
 *
 * @private
 */
MpdPool.prototype.onConnect = function() {
    this.isConnected = true;
    this.emit('connect', this.mpdClient);
}

/**
 * Event listener that is called then connection to MPD server is dead.
 *
 * @private
 */
MpdPool.prototype.onDisconnect = function() {
    this.isConnected = false;
    this.emit('disconnect', this.mpdClient);
    this.reconnect();
}

/**
 * Event listener that is called then connection to MPD cause error.
 *
 * @param {*} error Error that is passed from MPD client.
 * @private
 */
MpdPool.prototype.onError = function(error) {
    if (error.code === 'ECONNREFUSED' && this.options.reconnect) {
        this.reconnect();
        // Just wait while the connection will be restored.
        return;
    }

    // We should not reconnect and have to report about the error to the upper
    // layer.
    this.emit('error', error);
}

module.exports = MpdPool;
