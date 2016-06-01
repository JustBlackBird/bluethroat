var mpd = require('mpd'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    GenericPool = require('generic-pool').Pool;

/**
 * Represents a pool for MPD client connections.
 *
 * @param {Object} options List of pool objects. It could contains the following
 * keys:
 *  - "host": string, MPD server host to connect to. The default value is
 *    "localhost".
 *  - "port": integer, MPD server port to connect to. The default value is 6600.
 *  - "size": size of the pool.
 * @returns {MpdPool}
 */
var MpdPool = function(options) {
    /**
     * Options the pool was created with.
     *
     * @type {Object}
     * @private
     */
    this._options = _.defaults(options, {
        host: 'localhost',
        port: 6600,
        size: 10
    });

    /**
     * An instance of GenericPool which actually does all pool stuff.
     *
     * @type {Object}
     * @private
     */
    this._pool = new GenericPool({
        name: 'mpd',
        create: this._createClient.bind(this),
        destroy: this._destroyClient.bind(this),
        validate: this._validateClient.bind(this),
        min: 1,
        max: this._options.size,
        // Recover connection each hour.
        idleTimeoutMillis: 60 * 60 * 1000,
        log: false
    });

    /**
     * List of MPD clients which are dead.
     *
     * This list is used to check if a client is dead or alive.
     *
     * @type {Array}
     * @private
     */
    this._deadClients = [];
};

/**
 * Return MPD client.
 *
 * @returns {Promise} A promise which will be resolved with MPD client instance
 * or rejected with an error.
 */
MpdPool.prototype.getClient = function() {
    return new Promise(function(resolve, reject) {
        this._pool.acquire(function(err, client) {
            if (err) {
                reject(err);
            } else {
                resolve(client);
            }
        });
    }.bind(this));
};

/**
 * Returns the client back to the pool.
 *
 * @param {Object} client MPD client.
 */
MpdPool.prototype.releaseClient = function(client) {
    this._pool.release(client);
};

/**
 * Builds MPD client.
 *
 * This function is passed to GenericPool as factory.
 *
 * @param {Function} callback A function which will be called when the client is
 * ready or error occurs. Error is passed as the first argument and the client
 * as the second one.
 */
MpdPool.prototype._createClient = function(callback) {
    var client = mpd.connect({
        host: this._options.host,
        port: this._options.port
    });

    var onReady = function() {
        client.removeListener('error', onError);
        callback(null, client);
    };

    var onError = function(err) {
        client.removeListener('ready', onReady);
        callback(err);
    };

    client.once('ready', onReady);
    client.once('error', onError);

    client.on('end', function() {
        this._deadClients.push(client);
    }.bind(this));

    client.on('error', function() {
        this._deadClients.push(client);
    }.bind(this));
};

/**
 * Destroys MPD client.
 *
 * This function is passed to GenericPool.
 *
 * @param {Object} client MPD client.
 */
MpdPool.prototype._destroyClient = function(client) {
    var isDead = this._deadClients.some(function(currClient) {
        return client === currClient;
    });

    if (!isDead) {
        // It's a dirty hack which is needed until
        // https://github.com/andrewrk/mpd.js/pull/20 will be resolved.
        client.socket.destroy();
    } else {
        // The client is already dead. We should not kill it once again.
    }

    this._deadClients = this._deadClients.filter(function(currClient) {
        return client !== currClient;
    });
};

/**
 * Checks if MPD client is alive or is dead.
 *
 * This function is passed to GenericPool as a validator.
 *
 * @param {Object} client MPD client.
 * @returns {Boolean}
 */
MpdPool.prototype._validateClient = function(client) {
    for (var i = 0, len = this._deadClients.length; i < len; i++) {
        if (this._deadClients[i] === client) {
            return false;
        }
    }

    return true;
};

module.exports = MpdPool;
