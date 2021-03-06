var React = require('react'),
    connect = require('react-redux').connect,
    actions = require('../actions'),
    SwipeableViews = require('react-swipeable-views').default,
    Radio = require('../components/radio.jsx'),
    MessageContainer = require('../components/message_container.jsx'),
    AlarmSettings = require('../components/alarm_settings.jsx'),
    Tabs = require('../components/tabs.jsx');

/**
 * A component for the whole Application.
 *
 * This is the only "smart" React component.
 *
 * These options must be passed to the component:
 *  - currentStation
 *  - stations
 *  - alarmSettings
 *  - messages
 */
var Application = React.createClass({
    propTypes: {
        currentStation: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.oneOf([false])
        ]).isRequired,
        stations: React.PropTypes.array.isRequired,
        alarmSettings: React.PropTypes.object.isRequired,
        messages: React.PropTypes.array.isRequired
    },

    getInitialState: function() {
        return {
            activeTab: 0
        };
    },

    handlePlay: function(stationId) {
        this.props.dispatch(actions.radio.play(stationId));
    },

    handleStop: function() {
        this.props.dispatch(actions.radio.stop());
    },

    handleAlarmSettingsChange: function(settings) {
        this.props.dispatch(actions.alarmSettings.update(settings));
    },

    handleTabChange: function(index) {
        this.setState({
            activeTab: index
        });
    },

    render: function() {
        var alarmSettings = this.props.alarmSettings;

        return (
            <div>
                <MessageContainer messages={this.props.messages} />

                <Tabs
                    items={['Radio', 'Alarm']}
                    activeTab={this.state.activeTab}
                    onChange={this.handleTabChange}
                />

                <SwipeableViews
                    index={this.state.activeTab}
                    onChangeIndex={this.handleTabChange}
                    className="swipe-container"
                >
                    <Radio
                        stations={this.props.stations}
                        currentStation={this.props.currentStation}
                        onPlay={this.handlePlay}
                        onStop={this.handleStop}
                    />
                    <AlarmSettings
                        onChange={this.handleAlarmSettingsChange}
                        stations={this.props.stations}
                        {...alarmSettings}
                    />
                </SwipeableViews>
            </div>
        );
    }
});

module.exports = connect(function(state) {
    return state;
})(Application);
