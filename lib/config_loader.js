var fs = require('fs'),
    _ = require('underscore');

/**
 * Combine configurations array with default values.
 *
 * @param {Object} config Configurations array.
 * @returns {Object} Configuration options with filled in default values.
 */
var addDefaultValues = function(config) {
    var result = _.clone(config);

    if (!result.defaultRadioStation && result.radioStations.length > 0) {
        result.defaultRadioStation = result.radioStations[0].id;
    }

    if (!result.server) {
        result.server = {};
    }

    _.defaults(result.server, {
        port: 8000
    });

    return result;
};

/**
 * Checks configurations obbject for validity.
 *
 * @param {Object} config COnfigurations object to check.
 * @returns {Boolean|Array} Errors array or boolean false if there is no errors.
 */
var validateConfig = function(config) {
    var errors = [];

    if (!config.mpd || !config.mpd.host || !config.mpd.port) {
        errors.push('You must specify MPD host and port');
    }

    if (config.hasOwnProperty('radioStations')) {
        if (Object.keys(config.radioStations).length === 0) {
            errors.push('You must specify at least one radio station');
        }
    } else {
        errors.push('"radioStations" field is missed');
    }

    if (config.hasOwnProperty('storage')) {
        if (!config.storage.settings) {
            errors.push('You must specify connection params for settings storage');
        }
    } else {
        errors.push('"storage" filed is missed');
    }

    return errors.length === 0 ? false : errors;
};

/**
 * Loads and process configuration file.
 *
 * The function throws error if something is wrong.
 *
 * @param {String} file Configuration file path.
 * @returns {Object}
 */
exports.load = function(file) {
    var stats;
    try {
        stats = fs.statSync(file);
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw new Error('File "' + file + '" is not found.');
        } else {
            throw e;
        }
    }

    // Make sure specified file is a file.
    if (!stats.isFile()) {
        throw new Error('Specified config file is not a regular file');
    }

    // Get config's file contents.
    var contents = fs.readFileSync(file);

    var config;

    try {
        config = JSON.parse(contents);
    } catch(e) {
        // JSON.parse will throw error if the config is not a valid JSON
        // structure. Just alter error message to make it more usefull.
        throw new Error('Cannot parse config file: ' + e.message);
    }

    // Set default values
    config = addDefaultValues(config);

    // Make sure all fields are set and have correct values.
    var errors = validateConfig(config);

    if (errors) {
        // Throw the first found error.
        throw new Error(errors[0]);
    }

    return config;
};
