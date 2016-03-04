var React = require('react'),
    _ = require('lodash');

/**
 * A component for AlarmSettings block.
 *
 * This is a "dumb" React component.
 *
 * These options must be passed to the component:
 *  - stations
 *  - selectedStation
 *  - time
 *  - isEnabled
 *  - onChange
 */
var AlarmSettings = React.createClass({
    propTypes: {
        stations: React.PropTypes.arrayOf(React.PropTypes.shape({
            id: React.PropTypes.string.isRequired,
            name: React.PropTypes.string.isRequired
        })),
        selectedStation: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.oneOf([false])
        ]).isRequired,
        time: React.PropTypes.shape({
            hours: React.PropTypes.number.isRequired,
            minutes: React.PropTypes.number.isRequired
        }).isRequired,
        isEnabled: React.PropTypes.bool.isRequired,
        onChange: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        var selectedStation = this.props.selectedStation;

        if (!selectedStation && this.props.stations.length > 0) {
            selectedStation = this.props.stations[0].id;
        }

        return {
            selectedStation: selectedStation,
            hours: this.props.time.hours,
            minutes: this.props.time.minutes,
            isEnabled: this.props.isEnabled
        };
    },

    handleStationChange: function(event) {
        this.setState({
            selectedStation: event.target.value
        });
    },

    handleHoursChange: function(event) {
        this.setState({
            hours: event.target.value
        });
    },

    handleMinutesChange: function(event) {
        this.setState({
            minutes: event.target.value
        });
    },

    handleEnabledChange: function(event) {
        this.setState({
            isEnabled: event.target.checked
        });
    },

    handleSaveClick: function(event) {
        event.preventDefault();

        this.props.onChange({
            isEnabled: this.state.isEnabled,
            time: {
                hours: parseInt(this.state.hours),
                minutes: parseInt(this.state.minutes)
            },
            selectedStation: this.state.selectedStation
        });
    },

    render: function() {
        return (
            <div>
                <h2>Alarm Settings</h2>

                <form>
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={this.state.isEnabled}
                                onChange={this.handleEnabledChange}
                            /> Enabled
                        </label>
                    </div>

                    <div className="form-group">
                        <label>Hour:</label>
                        <select
                            className="form-control"
                            value={this.state.hours}
                            onChange={this.handleHoursChange}
                        >
                            {_.range(24).map(function(hour) {
                                return (<option key={hour} value={hour}>{hour}</option>);
                            })}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Minute: </label>
                        <select
                            className="form-control"
                            value={this.state.minutes}
                            onChange={this.handleMinutesChange}
                        >
                            {_.range(60).map(function(minute) {
                                return (<option key={minute} value={minute}>{minute}</option>);
                            })}
                        </select>
                    </div>

                    <div className="form-group">
                        <select
                            className="form-control"
                            value={this.state.selectedStation}
                            onChange={this.handleStationChange}
                        >
                            {this.props.stations.map(function(station) {
                                return (
                                    <option key={station.id} value={station.id}>
                                        {station.name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-default" onClick={this.handleSaveClick}>
                        Save!
                    </button>
                </form>
            </div>
        );
    }
});

module.exports = AlarmSettings;
