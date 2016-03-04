/**
 * Checks that response is correct.
 *
 * @param {Object} response An object which returned by Fetch API.
 * @returns {Promise}
 */
exports.status = function(response) {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
    } else {
        return response.json().catch(function() {
            // JSON parse failed. Use status text as error reason.
            return Promise.resolve({
                error: response.statusText
            });
        }).then(function(data) {
            // We need to notify outer code that the response is dead.
            return Promise.reject(new Error(data.error));
        });
    }
};
