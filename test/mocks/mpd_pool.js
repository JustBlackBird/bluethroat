var Promise = require('bluebird'),
    FakeMpdClient = require('./mpd_client');

var FakeMpdPool = function(client) {
    this._clientsInUse = 0;

    this._client = client;

    if (typeof client === 'undefined') {
        this._client = new FakeMpdClient();
    }
};

FakeMpdPool.prototype.getClient = function() {
    if (this._client) {
        this._clientsInUse++;

        return Promise.resolve(this._client);
    } else {
        return Promise.reject(new Error('The client is not specified'));
    }
};

FakeMpdPool.prototype.releaseClient = function(client) {
    this._clientsInUse--;
};

FakeMpdPool.prototype.getClientsInUse = function() {
    return this._clientsInUse;
};

module.exports = FakeMpdPool;
