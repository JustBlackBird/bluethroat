var util = require('util'),
    EventEmitter = require('events').EventEmitter;

/**
 * Represents settings storage.
 *
 * The object emits "change" event once a stored variable is changed. Callback
 * of this event should accept two arguments. The first argument is varaible
 * name that was changed and the second one is the new value of the variable.
 *
 * @todo Use a cache to reduce network operations count.
 *
 * @param {Object} nano Instance of nano which represents a database.
 * @returns {Settings}
 */
var Settings = function(nano) {
    EventEmitter.call(this);

    /**
     * Instance of nano which represents a database.
     *
     * @type Object
     * @private
     */
    this.nano = nano;

    /**
     * Queue for values that should be stored.
     *
     * The remote database is asynchronous and we need to use this queue to
     * prevent race conditions. Thus value of a variable are changed in
     * synchronous manner.
     *
     * The keys of the object are variables' names and values are objects with
     * the following items:
     *  - "value": object, the value that should be stored.
     *  - "callback": a function which should be called once the value is
     *    stored.
     *
     * @type Object
     * @private
     */
    this.updateQueue = {};
};

util.inherits(Settings, EventEmitter);

/**
 * Gets a stored variable.
 *
 * @param {String} name Name of the value to load.
 * @param {Function} callback A function which should be called when the
 * varaible will be loaded. This function should recieve two arguments. The
 * first one if an error string. If there was no error null will be passed in.
 * The second argument is the stored value. Notice that if the value is not
 * found undefined will be passed in.
 */
Settings.prototype.get = function(name, callback) {
    var self = this;

    this.retrieveDocument(name, function(error, doc) {
        if (error) {
            callback(self.formatError(error));

            return;
        }

        if (doc) {
            // Retrieve only value to the client.
            callback(null, doc.value);
        } else {
            // There is no document in the database
            callback(null, undefined);
        }
    });
};

/**
 * Stores a value with specified name.
 *
 * @param {String} name Name of the variable to store.
 * @param {*} value The value that should be stored. It could be of any type
 * that can be serialized to JSON.
 * @param {Function} callback A function which will be called once the value is
 * stored. If something went wrong error message will be passed into the
 * function as the first argument.
 */
Settings.prototype.set = function(name, value, callback) {
    if (!this.updateQueue.hasOwnProperty(name)) {
        // Make sure value's queue exists.
        this.updateQueue[name] = [];
    }

    // Add new value to the queue.
    this.updateQueue[name].push({
        value: value,
        // A nop function is used to reduce callback checking count.
        callback: (typeof callback === 'function') ? callback : function() {}
    });

    if (this.updateQueue[name].length !== 1) {
        // The update is alredy running and the value will be set when its turn
        // will come.
        return;
    }

    // Initialize the update process.
    this.doUpdate(name);
};

/**
 * Retrieves a document from the database.
 *
 * @private
 * @param {String} id ID of the document.
 * @param {Function} callback A function that will be called once the document
 * is retrieved. If something went wrong an error message will be passed to the
 * function as the first argument. The document will be passed to the function
 * as the second argument. Notice that if the database has no document with
 * specified ID undefined will be passed in to the callback instead of real
 * document.
 */
Settings.prototype.retrieveDocument = function(id, callback) {
    this.nano.get(id, function(error, doc) {
        if (error && error.error !== 'not_found') {
            // We should not termitate on "not_found" error. It's database
            // problem but not an application error.
            callback(error);

            return;
        }

        // "undefined" will be returned instead of real document if it's not
        // found.
        callback(null, error ? undefined : doc);
    });
};

/**
 * Performs updating of the variable.
 *
 * The value that should be set for the variable is taken from updateQueue.
 *
 * @private
 * @param {String} name Name of the variable that should be updated.
 */
Settings.prototype.doUpdate = function(name) {
    var self = this,
        item = this.updateQueue[name][0];

    this.retrieveDocument(name, function(error, doc) {
        if (error) {
            item.callback(self.formatError(error));

            return;
        }

        var updatedDocument = {value: item.value},
            originalValue = doc ? doc.value : undefined;

        if (doc) {
            // We should explicitly specify revision for existing documents.
            updatedDocument._rev = doc._rev;
        }

        self.nano.insert(updatedDocument, name, function(error) {
            // Run original client's callback
            item.callback(error ? self.formatError(error) : null);
            // Let the other world know that the value was changed.
            if (!error && (originalValue !== item.value)) {
                self.emit('change', name, item.value);
            }

            // Remove processed update.
            self.updateQueue[name].shift();
            // Run the next updater if needed.
            if (self.updateQueue[name].length > 0) {
                self.doUpdate(name);
            }
        });
    });
};

/**
 * Converts nano error to a string.
 *
 * @private
 * @param {Object} error Error object returned by nano.
 * @returns {String}
 */
Settings.prototype.formatError = function(error) {
    return error.error + ': ' + error.reason;
};

module.exports = Settings;
