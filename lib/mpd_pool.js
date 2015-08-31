var mpd = require('mpd'),
    _ = require('underscore'),
    inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;

/**
 * Represents wrapper for MPD client that makes sure the its connection is
 * alive.
 *
 * This class inherits behaviour of EventEmitter and emits the following events:
 *  - "connect": a connection to MPD server is established. An instance of MPD
 *    client will be passed to event's listeners as the first argument.
 *  - "disconnect": the current connection to MPD server is lost. An instance
 *    of MPD client will be passed to event's listeners as the first argument.
 *  - "error": the current connection to MPD server caused error. The rrror
 *    object will be passed to event's listeners as the first argument.
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
    this._options = _.defaults(options, {
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
    this._mpdClient = null;

    /**
     * Indicates if the connection to MPD server is alive.
     *
     * @type {Boolean}
     * @private
     */
    this._isConnected = false;

    /**
     * ID of the reconnection timer.
     *
     * This is needed to prevent multiple simultaneous reconnections.
     * @type {Number}
     * @private
     */
    this._reconnectTimeout = null;

    // Initialize the connection.
    this._connect();
};

inherits(MpdPool, EventEmitter);

/**
 * Return MPD client or null if there is no alive connections to MPD server.
 *
 * @param {Function} callback A function which will be called once the client is
 * ready. The first argument is error object or null if everything is fine. The
 * second argument is MPD Client object.
 * @returns {MpdClient|null}
 */
MpdPool.prototype.getClient = function(callback) {
    if (this._isConnected) {
        return callback(null, this._mpdClient);
    }

    var self = this;

    var onConnect = function(client) {
        client.once('ready', function() {
            self.removeListener('error', onError);
            callback(null, client);
        });
    };

    var onError = function(err) {
        self.removeListener('connect', onConnect);
        callback(err);
    };

    this.once('connect', onConnect);
    this.once('error', onError)
};

/**
 * Checks if the pool has connected client.
 *
 * @returns {Boolean}
 */
MpdPool.prototype.isConnected = function() {
    return this._isConnected;
};

/**
 * Connects to MPD server.
 *
 * @private
 */
MpdPool.prototype._connect = function() {
    var host = this._options.host,
        port = this._options.port;

    if (this._mpdClient) {
        this._mpdClient.removeAllListeners();
        this._mpdClient = null;
    }

    this._mpdClient = mpd.connect({
        host: host,
        port: port
    });

    this._mpdClient.on('connect', this._onConnect.bind(this));
    this._mpdClient.on('end', this._onDisconnect.bind(this));
    this._mpdClient.on('error', this._onError.bind(this));

    // Reset the reconnection timeout.
    this._reconnectTimeout = null;
};

/**
 * Refresh connection to MPD server if its dropped.
 *
 * Notice that reconnection is disabled on pool level the method will do
 * nothing.
 *
 * @private
 */
MpdPool.prototype._reconnect = function() {
    if (!this._options.reconnect) {
        // We should not try to reconnect to MPD server.
        return;
    }

    if (this._reconnectTimeout) {
        // The reconnection is already requested. Just do nothing and wait for
        // its results.
        return;
    }

    this._reconnectTimeout = setTimeout(this.connect.bind(this), this._options.timeout);
};

/**
 * Event listener that is called then connection to MPD server is established.
 *
 * @private
 */
MpdPool.prototype._onConnect = function() {
    this._isConnected = true;
    this.emit('connect', this._mpdClient);
};

/**
 * Event listener that is called then connection to MPD server is dead.
 *
 * @private
 */
MpdPool.prototype._onDisconnect = function() {
    this._isConnected = false;
    this.emit('disconnect', this._mpdClient);
    this._reconnect();
};

/**
 * Event listener that is called then connection to MPD cause error.
 *
 * @param {*} error Error that is passed from MPD client.
 * @private
 */
MpdPool.prototype._onError = function(error) {
    if (error.code === 'ECONNREFUSED' && this._options.reconnect) {
        this._reconnect();
        // Just wait while the connection will be restored.
        return;
    }

    // We should not reconnect and have to report about the error to the upper
    // layer.
    this.emit('error', error);
};

module.exports = MpdPool;
