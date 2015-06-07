var Router = require('express').Router,
    async = require('async'),
    forms = require('forms'),
    async = require('async'),
    renderer = require('../lib/forms/renderer'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

/**
 * Initializes route for the home page.
 *
 * @param {Radio} radio An instance of Radio.
 * @param {AlarmClock} alarm An instance of AlarmClock.
 * @param {Settings} settings An instance of Settings.
 * @returns {Object} Express router instance.
 */
module.exports = function(radio, alarm, settings) {
    var router = Router();

    // Build list of radio stations indexes
    var radioStations = radio.getAvailableStations(),
        radioStationChoices = [];
    for(var index in radioStations) {
        if (!radioStations.hasOwnProperty(index)) {
            continue;
        }

        radioStationChoices[index] = radioStations[index].name;
    }

    // Build settings form
    var settingsForm = forms.create({
        useAlarm: fields.boolean({
            label: 'Alarm enabled',
            cssClasses: {
                label: ['control-label']
            }
        }),
        wakeUpHour: fields.number({
            required: true,
            label: 'Hour:',
            validators: [
                validators.min(0),
                validators.max(23)
            ],
            cssClasses: {
                label: ['control-label']
            }
        }),
        wakeUpMinute: fields.number({
            required: true,
            label: 'Minute:',
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
            }
        })
    });

    // Register routes
    router.get('/', function(req, res) {
        // Set default settings values and render the settings form
        var alarmRingTime = alarm.getTime();
        var renderedSettingsForm = settingsForm.bind({
            useAlarm: alarm.isRunning(),
            wakeUpHour: alarmRingTime.hour.toString(),
            wakeUpMinute: alarmRingTime.minute.toString(),
            radioStation: radio.getCurrentStation()
        }).toHTML(renderer);

        // Add messages if needed
        var messages = [];
        if (typeof req.query.saved !== 'undefined') {
            messages.push('Settings saved');
        }

        // Render the page
        res.render(
            'index', {
                messages: messages,
                settingsForm: renderedSettingsForm
            }
        );
    });

    router.post('/', function(req, res) {
        settingsForm.handle(req, {
            success: function (form) {
                // Save settings
                alarm.setTime(form.data.wakeUpHour, form.data.wakeUpMinute);
                if (form.data.useAlarm) {
                    if (!alarm.isRunning()) {
                        alarm.run();
                    }
                } else {
                    if (alarm.isRunning()) {
                        alarm.stop();
                    }
                }
                radio.setCurrentStation(form.data.radioStation);

                // Prepare settings storage update tasks. They will be called in
                // asynchronous manner later.
                var tasks = [];

                tasks.push(function(callback) {
                    settings.set('alarm_enabled', form.data.useAlarm, callback);
                });

                tasks.push(function(callback) {
                    settings.set('alarm_time', {
                        hour: form.data.wakeUpHour,
                        minute: form.data.wakeUpMinute
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

    return router;
}
