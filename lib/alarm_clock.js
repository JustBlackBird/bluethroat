var util = require('util');
var events = require('events');

/**
 * Represents an alarm clock.
 *
 * It inherits EventEmitter functionality and triggers the following events:
 *   - "ring"
 *   - "setTime"
 *   - "run"
 *   - "stop"
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
     * A second the alarm should ring.
     *
     * @type Number
     * @private
     */
    this.second = 0;

    /**
     * Contains timer id for the currently running timeout or boolean false if
     * the timeout was never ininialized.
     *
     * @type Number|boolean
     * @private
     */
    this.timeout = false;

    /**
     * Indicates if "run" and "stop" events should not be emmited.
     *
     * @type Boolean
     * @private
     */
    this.skipStateEvents = false;
};

util.inherits(AlarmClock, events.EventEmitter);

/**
 * Sets the time when the alarm should ring.
 *
 * If the alarm is running now it will be restarted.
 *
 * @param {Number} hour An hour the alarm should ring.
 * @param {Number} minute A minute the alarm should ring.
 * @param {Number} second A second the alarm should ring. This argument can be
 * omitted. The default value is 0.
 */
AlarmClock.prototype.setTime = function(hour, minute, second) {
    this.hour = hour;
    this.minute = minute;
    this.second = second || 0;

    this.emit('setTime', this);

    if (this.isRunning()) {
        // Silently rerun the clock with the new alarm time
        this.skipStateEvents = true;
        this.stop();
        this.run();
        this.skipStateEvents = false;
    }
};

/**
 * Gets the time when the alarm should ring.
 *
 * @returns {Object} An object with three fields: "hour", "minute" and "second".
 */
AlarmClock.prototype.getTime = function() {
    var self = this;

    return {
        hour: self.hour,
        minute: self.minute,
        second: self.second
    };
};

/**
 * Make the alarm clock rings at the target time.
 */
AlarmClock.prototype.run = function() {
    var stateChanged = !this.isRunning();

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
            this.minute,
            this.second
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

    if (stateChanged && !this.skipStateEvents) {
        this.emit('run', this);
    }
};

/**
 * Prevents the alarm clock from ringing at the target time.
 */
AlarmClock.prototype.stop = function() {
    if (this.timeout) {
        // The clock is running
        clearTimeout(this.timeout);
        this.timeout = false;

        if (!this.skipStateEvents) {
            this.emit('stop', this);
        }
    }
};

/**
 * Indicates if the alarm clock is running or not.
 *
 * @returns {Boolean}
 */
AlarmClock.prototype.isRunning = function() {
    return (this.timeout !== false);
};

module.exports = AlarmClock;
