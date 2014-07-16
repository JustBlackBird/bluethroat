var forms = require('forms'),
    fields = forms.fields,
    validators = forms.validators,
    widgets = forms.widgets;

/**
 * Initialize '/' route.
 *
 * @param {Object} app Express application object
 */
exports.init = function(app) {
    // Build list of radio stations indexes
    var radioStations = app.radio.getAvailableStations(),
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
            label: 'Alarm enabled'
        }),
        wakeUpHour: fields.number({
            required: true,
            label: 'Hour:',
            validators: [
                validators.min(0),
                validators.max(23)
            ]
        }),
        wakeUpMinute: fields.number({
            required: true,
            label: 'Minute:',
            validators: [
                validators.min(0),
                validators.max(59)
            ]
        }),
        radioStation: fields.array({
            required: true,
            label: 'Radio station:',
            choices: radioStationChoices,
            widget: widgets.multipleRadio()
        })
    });

    // Register routes
    app.get('/', function(req, res) {
        // Set default settings values and render the settings form
        var alarmRingTime = app.alarm.getTime();
        var renderedSettingsForm = settingsForm.bind({
            useAlarm: app.alarm.isRunning(),
            wakeUpHour: alarmRingTime.hour.toString(),
            wakeUpMinute: alarmRingTime.minute.toString(),
            radioStation: app.radio.getCurrentStation()
        }).toHTML();

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

    app.post('/', function(req, res) {
        settingsForm.handle(req, {
            success: function (form) {
                // Save settings
                app.alarm.setTime(form.data.wakeUpHour, form.data.wakeUpMinute);
                if (form.data.useAlarm) {
                    if (!app.alarm.isRunning()) {
                        app.alarm.run();
                    }
                } else {
                    if (app.alarm.isRunning()) {
                        app.alarm.stop();
                    }
                }
                app.radio.setCurrentStation(form.data.radioStation);

                // Redirect a user to home page
                res.redirect('/?saved');
            },
            other: function (form) {
                res.render('index', {settingsForm: form.toHTML()});
            }
        });
    });
}
