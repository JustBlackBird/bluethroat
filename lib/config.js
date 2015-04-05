// Load configurations file
var config = require('../configs/config.json');

// Validate settings
if (!config.mpd || !config.mpd.host || !config.mpd.port) {
    throw new Error("You must specify MPD host and port");
}

if (!config.radioStations || (typeof config.radioStations !== 'object')) {
    throw new Error('"radioStations" field must be an object');
}

var isRadioStationsEmpty = true;
for(var index in config.radioStations) {
    if (config.radioStations.hasOwnProperty(index)) {
        isRadioStationsEmpty = false;
        config.defaultRadioStation = config.defaultRadioStation || index;
    }
}

if (isRadioStationsEmpty) {
    throw new Error("You must specify at least one radio station");
}

if (typeof config.storage !== 'object') {
    throw new Error('"storage" filed must be an object');
}

if (!config.storage.settings) {
    throw new Error('You must specify connection params for settings storage');
}

// Make sure the application port is set
config.server.port = config.server.port || 8000;

module.exports = config;
