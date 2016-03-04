var _ = require('lodash'),
    actionNames = require('../actions/names');

/**
 * Redux reducer for current station state.
 *
 * @param {Object} state Current state.
 * @param {Object} action Redux action.
 * @returns {Object} New state.
 */
module.exports = function(state, action) {
    var _state = _.isUndefined(state) ? false : state;

    switch(action.type) {
        case actionNames.PLAY_DONE:
            return action.station;
        case actionNames.STOP_DONE:
            return false;
        default:
            return _state;
    }
};
