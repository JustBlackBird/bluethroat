// Require libs
var express = require('express'),
    config = require('./lib/config.js'),
    middleware = require('./lib/middleware.js'),
    routes = require('./routes/index.js'),
    Radio = require('./lib/radio.js'),
    AlarmClock = require('./lib/alarm_clock');

// Initialize sound controller
var radio = new Radio(
    {
        mpdHost: config.mpd.host,
        mpdPort: config.mpd.port,
        stations: config.radioStations,
        defaultStation: config.defaultRadioStation
    },
    function() {
        // Initialize entire application
        var app = express();

        // Initialize alarm clock
        var alarm = new AlarmClock();
        alarm.setTime(9, 45);
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
        app.use('/', routes(radio, alarm));

        // Mount other middleware
        app.use(middleware.notFound);
        app.use(middleware.serverError);

        // Initialize HTTP server
        var appPort = config.server.port || 8000;
        app.listen(
            appPort,
            function() {
                console.log('Application is up on port ' + appPort.toString());
            }
        );
    }
);
