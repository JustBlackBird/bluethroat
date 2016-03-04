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
    var _state = _.isUndefined(state) ? [] : state;

    switch (action.type) {
        case actionNames.SHOW_MESSAGE:
            return _state.concat(action.message);
        case actionNames.HIDE_MESSAGE:
            return _state.filter(function(message) {
                return message.id !== action.messageId;
            });
        default:
            return _state;
    }
};
