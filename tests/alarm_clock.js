var should = require('should'),
    AlarmClock = require('../lib/alarm_clock');

describe('AlarmClock', function() {

    describe('time changing', function() {
        var alarm = new AlarmClock();

        it('should remember time', function() {
            alarm.setTime(9, 45, 18);

            var time = alarm.getTime();

            time.should.have.property('hours');
            time.hours.should.be.equal(9);

            time.should.have.property('minutes');
            time.minutes.should.be.equal(45);

            time.should.have.property('seconds');
            time.seconds.should.be.equal(18);
        });

        it('should use default value for "seconds"', function() {
            // Set time with seconds
            alarm.setTime(11, 12, 13);
            // Make sure the default values for seconds is used.
            alarm.setTime(18, 30);

            var time = alarm.getTime();
            time.should.have.property('seconds');
            time.seconds.should.be.equal(0);
        });

        it('should emit "setTime" event', function(done) {
            alarm.once('setTime', function(clock) {
                // Actually clock and alarm are the same objects
                var time = clock.getTime();

                time.hours.should.be.equal(8);
                time.minutes.should.be.equal(30);

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

    describe('alarm ringing', function() {
        it('should emit "ring" event when the time is came', function(done) {
            // We should wait until the clock is ring.
            this.timeout(1500);

            var alarm = new AlarmClock();

            alarm.once('ring', function() {
                true.should.be.true('the clock is rang');
                done();
            });

            // If the current timestamp has more than 800 milliseconds we have
            // to set seconds in the alarm clock to the second after the next
            // one. Otherwise just use the next second.
            var d = new Date(),
                seconds = d.getSeconds() + 1,
                milliseconds = d.getMilliseconds();

            if (milliseconds > 800) {
                seconds += 1;
            }

            alarm.setTime(
                d.getHours(),
                d.getMinutes(),
                seconds
            );
            alarm.run();
        });
    });

});
