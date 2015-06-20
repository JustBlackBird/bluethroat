var should = require('should'),
    AlarmClock = require('../lib/alarm_clock');

describe('AlarmClock', function() {

    describe('time changing', function() {
        var alarm = new AlarmClock();

        it('should remember time', function() {
            alarm.setTime(9, 45, 18);

            var time = alarm.getTime();

            time.should.have.property('hour');
            time.hour.should.be.equal(9);

            time.should.have.property('minute');
            time.minute.should.be.equal(45);

            time.should.have.property('second');
            time.second.should.be.equal(18);
        });

        it('should use default value for "second"', function() {
            // Set time with seconds
            alarm.setTime(11, 12, 13);
            // Make sure the default values for second is used.
            alarm.setTime(18, 30);

            var time = alarm.getTime();
            time.should.have.property('second');
            time.second.should.be.equal(0);
        });

        it('should emit "setTime" event', function(done) {
            alarm.once('setTime', function(clock) {
                // Actually clock and alarm are the same objects
                var time = clock.getTime();

                time.hour.should.be.equal(8);
                time.minute.should.be.equal(30);

                done();
            });

            alarm.setTime(8, 30);
        });
    });

    describe('run and stop', function() {
        var alarm = new AlarmClock();

        beforeEach(function() {
            // Set time but stop the clock
            alarm.setTime(7, 25);
            alarm.stop();
        });

        afterEach(function() {
            // Clear event listeners
            alarm.removeAllListeners();
        });

        it('should indicates state on run and stop', function() {
            alarm.run();
            alarm.isRunning().should.be.true;

            alarm.stop();
            alarm.isRunning().should.be.false;
        });

        it('should not run on time setting', function() {
            alarm.isRunning().should.be.false;
            alarm.setTime(3, 50);
            alarm.isRunning().should.be.false;
        });

        it('should emit "run" event', function(done) {
            alarm.once('run', function(clock) {
                // Actually clock and alarm are the same objects
                clock.isRunning().should.be.true;

                done();
            });

            alarm.run();
        });

        it('should emit "stop" event', function(done) {
            alarm.once('run', function(clock) {
                // Stop the alarm right after it's ran.
                clock.stop();
            });

            alarm.once('stop', function(clock) {
                // Actually clock and alarm are the same objects
                clock.isRunning().should.be.false;

                done();
            });

            alarm.run();
        });
    });

});
