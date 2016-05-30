var Router = require('express').Router,
    Promise = require('bluebird');

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

        stationsKeeper.get(stationId).then(function(station) {
            if (station === false) {
                res.status(500).json({error: 'Station is not found'});

                return Promise.resolve();
            }

            radio.setCurrentStation(station);

            return radio.play().then(function() {
                res.status(200).json({});
            });
        }).catch(function(err) {
            next(err);
        });
    });

    router.post('/actions/stop', function(req, res, next) {
        radio.stop().then(function() {
            res.status(200).json({});
        }).catch(function(err) {
            next(err);
        });
    });

    return router;
};
