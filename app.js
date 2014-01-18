// Require libs
var express = require('express'),
    config = require('./lib/config.js'),
    middleware = require('./lib/middleware.js'),
    routes = require('./routes/index.js'),
    Radio = require('./lib/radio.js'),
    alarm = require('./lib/alarm');

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

        // Configure the application
        app.configure(function() {
            // Set default values for runtime configs
            app.set('wake up hour', 9);
            app.set('wake up minute', 45);
            app.disable('alarm');

            // Use Handlebars template engine
            app.set('view engine', 'handlebars');
            app.engine('handlebars', require('hbs').__express);

            // Load and configure middleware
            app.use(express.static(__dirname + '/public'));
            app.use(express.urlencoded());
            app.use(app.router);
            app.use(middleware.notFound);
            app.use(middleware.serverError);
        });

        // Attache radio to the application object
        app.radio = radio;

        // Initialize routes
        routes.init(app);

        // Initialize alarm clock
        alarm.init(app);

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
