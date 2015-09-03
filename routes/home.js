var util = require('util'),
    Router = require('express').Router,
    async = require('async'),
    forms = require('forms'),
    async = require('async'),
    renderer = require('../lib/forms/renderer'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

/**
 * Builds Form object that is used to render and validate settings page.
 *
 * @param {RadioStationsKeeper} stationsKeeper
 * @param {Function} callback A function which will be called once the form is
 * build. The first argument will be set to error object or to null if
 * everything is fine. The second argument will be set to form object.
 */
var buildSettingsForm = function(stationsKeeper, callback) {
    // This validator checks that the choosen station is correct.
    var stationValidator = function(form, field, cb) {
        if (field.data.length !== 1) {
            return cb('Wrong count of selected values. Exactly one value must be selected.');
        }

        stationsKeeper.get(field.data[0], function(err, station) {
            if (err) {
                return cb('Could not really check existance of the station.');
            }

            if (!station) {
                return cb('Unknown station "' + field.data[0] + '"');
            }

            cb();
        });
    };

    stationsKeeper.all(function(err, radioStations) {
        if (err) {
            return callback(err);
        }

        // Build list of radio stations indexes
        var radioStationChoices = [];
        radioStations.forEach(function(station) {
            radioStationChoices[station.id] = station.name;
        });

        // Build settings form
        var settingsForm = forms.create({
            useAlarm: fields.boolean({
                label: 'Alarm enabled',
                cssClasses: {
                    label: ['control-label']
                }
            }),
            wakeUpHours: fields.number({
                required: true,
                label: 'Hours:',
                validators: [
                    validators.min(0),
                    validators.max(23)
                ],
                cssClasses: {
                    label: ['control-label']
                }
            }),
            wakeUpMinutes: fields.number({
                required: true,
                label: 'Minutes:',
                validators: [
                    validators.min(0),
                    validators.max(59)
                ],
                cssClasses: {
                    label: ['control-label']
                }
            }),
            radioStation: fields.array({
                required: true,
                label: 'Radio station:',
                choices: radioStationChoices,
                widget: widgets.select(),
                cssClasses: {
                    label: ['control-label']
                },
                validators: [
                    stationValidator
                ]
            })
        });

        callback(null, settingsForm);
    });
};

/**
 * Initializes route for the home page.
 *
 * @param {Radio} radio An instance of Radio.
 * @param {RadioStationsKeeper} stationsKeeper An instance of RadioStationsKeeper.
 * @param {AlarmClock} alarm An instance of AlarmClock.
 * @param {Settings} settings An instance of Settings.
 * @returns {Object} Express router instance.
 */
module.exports = function(radio, stationsKeeper, alarm, settings) {
    var router = Router();

    // Register routes
    router.get('/', function(req, res, next) {
        buildSettingsForm(stationsKeeper, function(err, settingsForm) {
            if (err) {
                return next(err);
            }

            // Set default settings values and render the settings form
            var alarmRingTime = alarm.getTime();
            var renderedSettingsForm = settingsForm.bind({
                useAlarm: alarm.isRunning(),
                wakeUpHours: alarmRingTime.hours.toString(),
                wakeUpMinutes: alarmRingTime.minutes.toString(),
                radioStation: radio.getCurrentStation().id
            }).toHTML(renderer);

            // Add messages if needed
            var messages = [];
            if (typeof req.query.saved !== 'undefined') {
                messages.push('Settings saved');
            }

            // Render the page
            res.render('index', {
                messages: messages,
                settingsForm: renderedSettingsForm
            });
        });
    });

    router.post('/', function(req, res, next) {
        buildSettingsForm(stationsKeeper, function(err, settingsForm) {
            if (err) {
                return next(err);
            }

            settingsForm.handle(req, {
                success: function (form) {
                    // Save settings
                    alarm.setTime(form.data.wakeUpHours, form.data.wakeUpMinutes);
                    if (form.data.useAlarm) {
                        if (!alarm.isRunning()) {
                            alarm.run();
                        }
                    } else {
                        if (alarm.isRunning()) {
                            alarm.stop();
                        }
                    }

                    // Prepare settings storage update tasks. They will be called in
                    // asynchronous manner later.
                    var tasks = [];

                    tasks.push(function(callback) {
                        stationsKeeper.get(form.data.radioStation, function(err, station) {
                            if (err) {
                                return callback(err);
                            }

                            if (!station) {
                                return next(new Error(util.format(
                                    'Unknown station "%s"',
                                    form.data.radioStation
                                )));
                            }

                            radio.setCurrentStation(station);
                            callback(null);
                        });
                    });

                    tasks.push(function(callback) {
                        settings.set('alarm_enabled', form.data.useAlarm, callback);
                    });

                    tasks.push(function(callback) {
                        settings.set('alarm_time', {
                            hours: form.data.wakeUpHours,
                            minutes: form.data.wakeUpMinutes
                        }, callback);
                    });

                    // Update settings in the storage.
                    async.parallel(tasks, function(error) {
                        if (error) {
                            // By some reason settings could not be updated in the
                            // storage. Let the outer code know about it. This
                            // exception will be caught by Express and passed to
                            // error-processing middleware.
                            throw error;
                        }

                        // Redirect a user to home page when all settings will be
                        // updated.
                        res.redirect('/?saved');
                    });
                },
                other: function (form) {
                    res.render('index', {settingsForm: form.toHTML(renderer)});
                }
            });
        });
    });

    return router;
}
