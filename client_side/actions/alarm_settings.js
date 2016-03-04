var fetch = require('isomorphic-fetch'),
    actionNames = require('./names'),
    messageActions = require('./message'),
    status = require('../utils/request').status;

/**
 * Builds UPDATE_ALARM_SETTINGS action.
 *
 * This is an action creator.
 *
 * @param {Object} settings List of settings. It must contain the following keys:
 *  - isEnabled
 *  - selectedStation
 *  - time
 * @returns Redux action
 */
exports.update = function(settings) {
    return function(dispatch, getState) {
        dispatch({
            type: actionNames.UPDATE_ALARM_SETTINGS,
            settings: settings
        });

        var serverUrl = getState().serverUrl;

        fetch(serverUrl + '/api/alarm/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        })
        .then(status)
        .then(function(response) {
            dispatch({
                type: actionNames.UPDATE_ALARM_SETTINGS_DONE
            });

            dispatch(messageActions.show('Settings updated'));
        }).catch(function(err) {
            dispatch({
                type: actionNames.UPDATE_ALARM_SETTINGS_ERROR,
                error: err
            });

            dispatch(messageActions.show(err.message, true));
        });
    };
};
