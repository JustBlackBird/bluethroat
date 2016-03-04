var _ = require('lodash'),
    actionNames = require('../actions/names');

/**
 * Redux reducer for alarm settings state.
 *
 * @param {Object} state Current state.
 * @param {Object} action Redux action.
 * @returns {Object} New state.
 */
module.exports = function(state, action) {
    var _state = _.isUndefined(state) ? {
        selectedStation: false,
        isEnabled: false,
        time: {
            hours: 9,
            minutes: 45
        }
    } : state;

    switch (action.type) {
        case actionNames.UPDATE_ALARM_SETTINGS:
            return action.settings;
        default:
            return _state;
    }
};
