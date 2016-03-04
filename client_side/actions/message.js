var actionNames = require('./names');

/**
 * This sequence is used to generate unique ID for messages.
 *
 * @type Number
 */
var idSequence = 0;

/**
 * Builds SHOW_MESSAGE action.
 *
 * This is an action creator.
 *
 * @param {String} message A message which should be delivered.
 * @param {Boolean} isError Indicates if the message is error one.
 * @returns Redux action.
 */
exports.show = function(message, isError) {
    var msgText = (typeof message === 'string') ? message : message.toString();

    return function(dispatch) {
        var id = ++idSequence;
        dispatch({
            type: actionNames.SHOW_MESSAGE,
            message: {
                id: id,
                message: msgText,
                isError: !!isError
            }
        });

        setTimeout(function() {
            dispatch(hideMessage(id));
        }, 10000);
    };
};


/**
 * Builds HIDE_MESSAGE action.
 *
 * This is an action creator.
 *
 * @param {Number} id ID of the message which should be hidden.
 * @returns Redux action.
 */
var hideMessage = exports.hide = function(id) {
    return {
        type: actionNames.HIDE_MESSAGE,
        messageId: id
    };
};
