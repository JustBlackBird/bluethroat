var util = require('util');
var events = require('events');

/**
 * Represents an alarm clock.
 *
 * It inherits EventEmitter functionality and emits "ring" event when the time
 * is came.
 *
 * @returns {AlarmClock}
 */
var AlarmClock = function() {
    // Runs parent constructor
    events.EventEmitter.call(this);

    /**
     * An hour the alarm should ring.
     *
     * @type Number
     * @private
     */
    this.hour = 0;

    /**
     * A minute the alarm should ring.
     *
     * @type Number
     * @private
     */
    this.minute = 0;

    /**
     * Contains timer id for the currently running timeout or boolean false if
     * the timeout was never ininialized.
     *
     * @type Number|boolean
     * @private
     */
    this.timeout = false;
}

util.inherits(AlarmClock, events.EventEmitter);

/**
 * Sets the time when the alarm should ring.
 *
 * @param {Number} hour An hour the alarm should ring.
 * @param {Number} minute A minute the alarm should ring.
 */
AlarmClock.prototype.setTime = function(hour, minute) {
    this.hour = hour;
    this.minute = minute;

    if (this.isRunning()) {
        // Rerun the clock with the new alarm time
        this.stop();
        this.run();
    }
}

/**
 * Gets the time when the alarm should ring.
 *
 * @returns {Object} An object with two fields: "hour" and "minute".
 */
AlarmClock.prototype.getTime = function() {
    var self = this;

    return {
        hour: self.hour,
        minute: self.minute
    }
}

/**
 * Make the alarm clock rings at the target time.
 */
AlarmClock.prototype.run = function() {
    // Stop the current timeout if needed
    if (this.timeout) {
        clearTimeout(this.timeout);
    }

    // Calculate interval that should be used for the timeout
    var now = new Date(),
        targetDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            this.hour,
            this.minute
        ),
        diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
        diff += 24 * 60 * 60 * 1000;
    }

    // Initialize timeout
    var self = this;
    this.timeout = setTimeout(function() {
        self.emit('ring', self);
        // Rerun the timeout
        self.run();
    }, diff);
}

/**
 * Prevents the alarm clock from ringing at the target time.
 */
AlarmClock.prototype.stop = function() {
    if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = false;
    }
}

/**
 * Indicates if the alarm clock is running or not.
 *
 * @returns {Boolean}
 */
AlarmClock.prototype.isRunning = function() {
    return (this.timeout !== false);
}

module.exports = AlarmClock;
