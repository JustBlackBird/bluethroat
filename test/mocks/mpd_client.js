var async = require('async'),
    EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits;

var noop = function() {};

/**
 * A mock that mimics MpdClient behavior.
 *
 * @returns {Object}
 */
var FakeMpdClient = function() {
    EventEmitter.call(this);

    // A storage for set commands.
    this._commands = [];

    // Internal Client's status
    this._status = {
        state: 'stop'
    };

    // This is an Error wich should be returned any time a command is sent.
    // false means no error should be returned.
    this._error = false;
};

inherits(FakeMpdClient, EventEmitter);

FakeMpdClient.prototype.sendCommand = function(command, callback) {
    // Make sure stub works fine even if there is no callback specified
    var done = callback || noop;

    this._commands.push(command);

    if (this._error) {
        return callback(this._error);
    }

    var response = '';
    if (command.name === 'status') {
        Object.keys(this._status).forEach(function(key) {
            response += key + ': ' + this._status[key] + '\n';
        }.bind(this));
    }

    done(null, response);
};

/**
 * This stub is just run "sendCommand" several times.
 */
FakeMpdClient.prototype.sendCommands = function(commands, callback) {
    // Make sure stub works fine even if there is no callback specified
    var done = callback || noop;

    var combinedResponse = '';
    async.eachSeries(commands, function(command, next) {
        this.sendCommand(command, function(err, response) {
            combinedResponse += (response || '');
            next(err);
        });
    }.bind(this), function(err) {
        if (err) {
            return done(err);
        }

        done(null, combinedResponse);
    });
};

/**
 * This is not a part of MpdClient and is used spy for commands calls.
 */
FakeMpdClient.prototype.getRecordedCommands = function() {
    return this._commands;
};

/**
 * This is not a part of MpdClient API and is used to alter internal client's
 * status.
 */
FakeMpdClient.prototype.setInternalStatus = function(status) {
    this._status = status;
};

/**
 * This is not a part of MpdClient API and is used to return a error for
 * commands.
 */
FakeMpdClient.prototype.setInternalError = function(err) {
    this._error = err;
};

module.exports = FakeMpdClient;
