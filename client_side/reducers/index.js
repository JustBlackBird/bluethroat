var combineReducers = require('redux').combineReducers,
    _ = require('lodash'),
    currentStation = require('./current_station'),
    messages = require('./messages'),
    alarmSettings = require('./alarm_settings');

/**
 * Combined Redux reducer that works with the whole Application state.
 *
 * @type {Function}
 * @param {Object} state Current state.
 * @param {Object} action Redux action.
 * @returns {Object} New state.
 */
module.exports = combineReducers({
    serverUrl: function (state, action) {
        // This reducer does nothing but is here to let the developers know
        // that the serverUrl is unchangeable.
        return _.isUndefined(state) ? '' : state;
    },
    messages: messages,
    currentStation: currentStation,
    alarmSettings: alarmSettings,
    stations: function(state, action) {
        // This reducer does nothing but is here to let the developers know
        // that the stations list is unchanged.
        return _.isUndefined(state) ? [] : state;
    }
});
