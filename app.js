// Require libs
var path = require('path'),
    express = require('express'),
    nano = require('nano'),
    ConfigLoader = require('./lib/config_loader'),
    middleware = require('./lib/middleware'),
    routes = require('./routes/index'),
    Radio = require('./lib/radio'),
    MpdPool = require('./lib/mpd_pool'),
    AlarmClock = require('./lib/alarm_clock'),
    Settings = require('./lib/settings');

var config = ConfigLoader.load(path.normalize(__dirname + '/configs/config.json'));

var settings = new Settings(nano(config.storage.settings));

var mpdPool = new MpdPool({
    host: config.mpd.host,
    port: config.mpd.port,
    reconnect: true,
    timeout: 100
});

var radio = new Radio(mpdPool, {
    stations: config.radioStations,
    defaultStation: config.defaultRadioStation
});

radio.on('ready', function() {
    // Initialize entire application
    var app = express();

    // Initialize alarm clock
    var alarm = new AlarmClock();

    // Actually the http server should be initialize AFTER all callbacks of
    // "settings.get" method will be ran. This is not done in that way because
    // of simplicity. In most cases it should not brings any problems because
    // "settings.get" method is really fast and finishes before the HTTP server
    // is up and running.
    // TODO: Initialize HTTP server only when all "settings.get" callbacks will
    // be ran.

    // Get the current alarm time from the storage.
    settings.get('alarm_time', function(error, time) {
        if (error) {
            throw error;
        }

        if (time) {
            alarm.setTime(time.hours, time.minutes);
        } else {
            // There is no alarm time stored. Use a default one.
            alarm.setTime(9, 45);
        }
    });

    // Get the current state of alarm clock.
    settings.get('alarm_enabled', function(error, isEnabled) {
        if (error) {
            throw error;
        }

        if (isEnabled) {
            alarm.run();
        }
    });

    alarm.on('ring', function() {
        if (!radio.isPlaying()) {
            // Time to wake up. Turn on the radio
            radio.fadeIn();
        }
    });

    // Use Handlebars template engine
    app.set('view engine', 'handlebars');
    app.engine('handlebars', require('hbs').__express);

    // Serve static files
    app.use(express.static(__dirname + '/public'));

    // Mount routes
    app.use('/', routes(radio, alarm, settings));

    // Mount other middleware
    app.use(middleware.notFound);
    app.use(middleware.serverError);

    // Initialize HTTP server
    app.listen(
        config.server.port,
        function() {
            console.log('Application is up on port ' + config.server.port.toString());
        }
    );
});
