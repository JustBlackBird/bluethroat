var Router = require('express').Router;

/**
 * Initialize API routes for radio control.
 *
 * @param {Radio} radio An instance of the radio.
 * @param {StationsKeeper} stationsKeeper An instance of Stations Keeper.
 * @returns {Object} Express router instance.
 */
module.exports = function(radio, stationsKeeper) {
    var router = Router();

    router.post('/actions/play', function(req, res, next) {
        var stationId = req.body.station;

        stationsKeeper.get(stationId, function(err, station) {
            if (err) {
                return next(err);
            }

            if (station === false) {
                res.status(500).json({error: 'Station is not found'});

                return;
            }

            radio.setCurrentStation(station);
            radio.play(function(err) {
                if (err) {
                    return next(err);
                }

                res.status(200).json({});
            });
        });
    });

    router.post('/actions/stop', function(req, res, next) {
        radio.stop(function(err) {
            if (err) {
                return next(err);
            }

            res.status(200).json({});
        });
    });

    return router;
};
