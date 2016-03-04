var fetch = require('isomorphic-fetch'),
    actionNames = require('./names'),
    messageActions = require('./message'),
    status = require('../utils/request').status;

/**
 * Builds PLAY action.
 *
 * This is an action creator.
 *
 * @param {String} station ID of the station that should be played.
 * @returns Redux action.
 */
exports.play = function(station) {
    return function(dispatch, getState) {
        dispatch({
            type: actionNames.PLAY,
            station: station
        });

        var serverUrl = getState().serverUrl;

        fetch(serverUrl + '/api/radio/actions/play/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({station: station})
        })
        .then(status)
        .then(function(response) {
            dispatch({
                type: actionNames.PLAY_DONE,
                station: station
            });
        }).catch(function(err) {
            dispatch({
                type: actionNames.PLAY_ERROR,
                station: station,
                error: err
            });

            dispatch(messageActions.show(err.message, true));
        });
    };
};

/**
 * Builds STOP action.
 *
 * This is an action creator.
 *
 * @returns Redux action.
 */
exports.stop = function() {
    return function(dispatch, getState) {
        dispatch({
            type: actionNames.STOP
        });

        var serverUrl = getState().serverUrl;

        fetch(serverUrl + '/api/radio/actions/stop/', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({})
        })
        .then(status)
        .then(function() {
            dispatch({
                type: actionNames.STOP_DONE
            });
        }).catch(function(err) {
            dispatch({
                type: actionNames.STOP_ERROR,
                error: err
            });

            dispatch(messageActions.show(err.message, true));
        });
    };
};
