var child_process = require('child_process'),
    fs = require('fs');

/**
 * A daemon which can run and control something in the background.
 *
 * @param {Object} options Daemon options. It can contains the following keys:
 *   - log: Name of the log file.
 *   - errorLog: Name of the error log file.
 *   - env: List of environment variables that should be set for the spawned
 *          process.
 *   - pid: Name of the pid file.
 *   - cwd: Working directory, that should be set for the spawned process.
 *   - uid: ID of the user that should be set for the spawned process.
 *   - gid: ID of the group that should be set for the spawned process.
 */
module.exports = function(options) {
    var opt = options || {};

    /**
     * Daemon settings.
     *
     * @private
     * @type {Object}
     */
    var settings = {
        log: opt.log || false,
        errorLog: opt.errorLog || false,
        env: opt.env || process.env,
        pid: opt.pid || (process.cwd() + '/daemon.pid'),
        cwd: opt.cwd || process.cwd(),
        uid: opt.uid || process.getuid(),
        gid: opt.gid || process.getgid()
    };

    /**
     * Checks if the daemon is already running.
     *
     * @returns {Boolean}
     */
    this.isRunning = function() {
        // Get PID for the last run.
        var lastPid = readPidFile();
        if (!lastPid) {
            return false;
        }

        // Check if the daemon is running
        try {
            process.kill(lastPid, 0);

            return true;
        } catch(e) {
            return false;
        }
    };

    /**
     * Starts a script as a daemon.
     *
     * @param {String} script Name of the script to run.
     * @returns {Boolean} True if the script have been run and false otherwise.
     */
    this.start = function(script) {
        if (!script) {
            throw new Error('You should specify a script to run.');
        }

        if (this.isRunning()) {
            return false;
        }

        // Prepare log files
        var logStream = 'ignore';
        if (settings.log) {
            logStream = fs.openSync(settings.log, 'a');
            fs.fchownSync(logStream, settings.uid, settings.gid);
        }

        var errorLogStream = 'ignore';
        if (settings.errorLog) {
            errorLogStream = fs.openSync(settings.errorLog, 'a');
            fs.fchownSync(errorLogStream, settings.uid, settings.gid);
        }

        // Spawn a child process
        var child = child_process.spawn(process.execPath, [script], {
            detached: true,
            stdio: ['ignore', logStream, errorLogStream],
            env: settings.env,
            cwd: settings.cwd,
            uid: settings.uid,
            gid: settings.gid
        });

        // We need the following to parent process can exit
        child.unref();

        // Save process id to PID file
        writePidFile(child.pid);

        return true;
    };

    /**
     * Stops the currently running daemon.
     */
    this.stop = function() {
        var pid = readPidFile();

        if (pid) {
            process.kill(pid, 'SIGTERM');
            removePidFile();
        }
    };

    /**
     * Reads process id from the PID file.
     *
     * @returns {Number}|{Boolean} Process id or false if it cannot be got.
     */
    var readPidFile = function() {
        if (fs.existsSync(settings.pid)) {
            return fs.readFileSync(settings.pid) || false;
        }

        return false;
    };

    /**
     * Writes process id to the PID file.
     *
     * @param {Number} ID of the process to write.
     */
    var writePidFile = function(pid) {
        fs.writeFileSync(settings.pid, pid);
    };

    /**
     * Removes PID file.
     */
    var removePidFile = function() {
        if (fs.existsSync(settings.pid)) {
            fs.unlinkSync(settings.pid);
        }
    };
};
