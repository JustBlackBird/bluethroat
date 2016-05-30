// Require libs
var path = require('path'),
    express = require('express'),
    nano = require('nano'),
    _ = require('lodash'),
    ConfigLoader = require('./lib/config_loader'),
    middleware = require('./lib/middleware'),
    routes = require('./routes/index'),
    Radio = require('./lib/radio'),
    MpdPool = require('./lib/mpd_pool'),
    AlarmClock = require('./lib/alarm_clock'),
    Settings = require('./lib/settings'),
    RadioStationsKeeper = require('./lib/radio_stations_keeper'),
    Application = require('./lib/application');

var config = ConfigLoader.load(path.normalize(__dirname + '/configs/config.json'));

var settings = new Settings(nano(config.storage.settings)),
    stationsKeeper = new RadioStationsKeeper(config.radioStations),
    alarm = new AlarmClock(),
    mpdPool = new MpdPool({
        host: config.mpd.host,
        port: config.mpd.port,
        reconnect: true,
        timeout: 100
    }),
    radio = new Radio(mpdPool);

radio.setCurrentStation(_.find(config.radioStations, function(station) {
    return station.id === config.defaultRadioStation;
}));

var app = new Application(radio, stationsKeeper, alarm, settings);

app.run().then(function() {
    return new Promise(function(resolve, reject) {
        // Initialize entire server application.
        var server = express();

        // Use Handlebars template engine.
        server.set('view engine', 'handlebars');
        server.engine('handlebars', require('hbs').__express);

        // Serve static files.
        server.use(express.static(__dirname + '/public'));

        // Mount routes.
        server.use('/', routes(app));

        // Mount other middleware.
        server.use(middleware.notFound);
        server.use(middleware.serverError);

        // Connect HTTP server.
        server.listen(
            config.server.port,
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}).then(function() {
    console.log('Application is up on port ' + config.server.port.toString());
}).catch(function(err) {
    console.error(err);
    process.exit();
});
