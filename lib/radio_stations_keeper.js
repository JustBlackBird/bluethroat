var util = require('util'),
    _ = require('lodash'),
    Promise = require('bluebird');

/**
 * A container that helps to manage radio stations.
 *
 * @param {Array} stations List of stations that will be used once the keeper is
 * created. Each item of the array is an object with "id", "name" and "url"
 * keys.
 * @returns {RadioStationsKeeper}
 */
var RadioStationsKeeper = function(stations) {
    this._stations = {};

    if (stations && stations.length !== 0) {
        stations.forEach(function(station) {
            // Make sure the stations are valid.
            var err = this.validate(station);
            if (err) {
                throw err;
            }

            this._stations[station.id] = station;
        }, this);
    }
};

/**
 * Checks if the station with the specified ID exists inside of the keeper.
 *
 * @param {String} id ID of the station to check.
 * @returns {Promise} A promise which will be resolved with check result.
 */
RadioStationsKeeper.prototype.has = function(id) {
    return Promise.resolve(_.has(this._stations, id));
};

/**
 * Adds the station to the keeper.
 *
 * @param {Object} station An object which describes radio station. It must have
 * "id", "name" and "url" keys.
 * @returns {Promise} A promise which will be resolved once the station is added
 * and rejected on error.
 */
RadioStationsKeeper.prototype.add = function(station) {
    var err = this.validate(station);

    if (err) {
        return Promise.reject(err);
    }

    return this.has(station.id).then(function(exists) {
        if (exists) {
            return Promise.reject(new Error(util.format(
                'Station "%s" already exists.',
                station.id
            )));
        }
    }).then(function() {
        this._stations[station.id] = station;

        return Promise.resolve();
    }.bind(this));
};

/**
 * Retrieves radio station from the keeper.
 *
 * @param {String} id ID of the station to retrieve.
 * @returns {Promise} A promise which will be resolved with station data or
 * rejected on error.
 */
RadioStationsKeeper.prototype.get = function(id) {
    return this.has(id).then(function(exists) {
        return Promise.resolve(exists ? this._stations[id] : false);
    }.bind(this));
};

/**
 * Retrueves all stations from the keeper.
 *
 * @returns {Promise} A promise which will be resolved with all stations or
 * rejected on error.
 */
RadioStationsKeeper.prototype.all = function() {
    return Promise.resolve(_.values(this._stations));
};

/**
 * Checks if the passed in radion station is valid.
 *
 * @param {Object} station Radio station object to validate.
 * @returns {Error|Boolean} Boolean false if the station is valid and an Error
 * object otherwise.
 */
RadioStationsKeeper.prototype.validate = function(station) {
    var mandatoryFields = ['id', 'url', 'name'];

    for (var i = 0, l = mandatoryFields.length; i < l; i++) {
        if (!station.hasOwnProperty(mandatoryFields[i])) {
            return new Error(util.format(
                '"%s" field is missed.',
                mandatoryFields[i]
            ));
        }
    }

    return false;
};

module.exports = RadioStationsKeeper;
