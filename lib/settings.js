var Promise = require('bluebird');

/**
 * Represents settings storage.
 *
 * @param {Object} nano Instance of nano which represents a database.
 * @returns {Settings}
 */
var Settings = function(nano) {
    /**
     * Instance of nano which represents a database.
     *
     * @type Object
     * @private
     */
    this._nano = nano;
};

/**
 * Gets a stored variable.
 *
 * @param {String} name Name of the value to load.
 * @returns {Promise} A promise which will be resolved when the varaible will be
 * loaded or rejected on error.
 */
Settings.prototype.get = function(name) {
    return this._getDocument(name).then(function(doc) {
        if (doc) {
            // Retrieve only value to the client.
            return doc.value;
        } else {
            // There is no document in the database
            return undefined;
        }
    }).catch(function(error) {
        var wrappedError = new Error('Cannot get value');
        wrappedError.originalError = error;

        return Promise.reject(wrappedError);
    }.bind(this));
};

/**
 * Stores a value with specified name.
 *
 * @param {String} name Name of the variable to store.
 * @param {*} value The value that should be stored. It could be of any type
 * that can be serialized to JSON.
 * @returns {Promise} A promise which will be resolved once the value is
 * stored or rejected on error.
 */
Settings.prototype.set = function(name, value) {
    return this._getRevision(name).then(function(rev) {
        var updatedDocument = {value: value};

        if (rev) {
            // We have to explicitly set the previous revision if exists.
            updatedDocument._rev = rev;
        }

        return this._insertDocument(name, updatedDocument);
    }.bind(this)).catch(function(error) {
        var wrappedError = new Error('Cannot set value');
        wrappedError.originalError = error;

        return Promise.reject(wrappedError);
    }.bind(this));
};

/**
 * Retrieves a document from the database.
 *
 * @private
 * @param {String} id ID of the document.
 * @returns {Promise} A promise which will be resolved once the document is
 * retrieved or rejected on error. Notice that if the database has no document
 * with specified ID the promise will be resolved with undefined.
 */
Settings.prototype._getDocument = function(id) {
    return new Promise(function(resolve, reject) {
        this._nano.get(id, function(error, doc) {
            if (error && error.error !== 'not_found') {
                // We should not termitate on "not_found" error. It's database
                // problem but not an application error.
                reject(error);

                return;
            }

            // "undefined" will be returned instead of real document if it's not
            // found.
            resolve(error ? undefined : doc);
        });
    }.bind(this));
};

/**
 * Retrieves current revision of a document from the database.
 *
 * @private
 * @param {String} id ID of the document which revision should be got.
 * @returns {Promise} A promise which will be resolved once the revision is
 * loaded or rejected on error. Notice that if the database has no document
 * with specified ID the promise will be resolved with undefined.
 */
Settings.prototype._getRevision = function(id) {
    return new Promise(function(resolve, reject) {
        this._nano.head(id, function(error, body, headers) {
            if (error && error.statusCode !== 404) {
                reject(error);
            } else {
                var rev = !!error
                    // The document is not found. It's not an error it just
                    // means that there was no previous revision.
                    ? undefined
                    // Revision wrapped in extra double quotes. Remove them
                    : headers.etag.replace(/^"/, '').replace(/"$/, '');

                resolve(rev);
            }
        });
    }.bind(this));
};

/**
 * Sends document to couchdb.
 *
 * @private
 * @param {String} name Name of the variable that should be updated.
 * @param {Object} doc Document that should be inserted.
 * @returns {Promise} A promise which will be resolved once the document is
 * saved and rejected on error.
 */
Settings.prototype._insertDocument = function(id, doc) {
    return new Promise(function(resolve, reject) {
        this._nano.insert(doc, id, function(error) {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    }.bind(this));
};

module.exports = Settings;
