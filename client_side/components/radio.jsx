var React = require('react'),
    RadioStation = require('./radio_station.jsx');

/**
 * A component for the whole Radio block.
 *
 * This is a "dumb" React component.
 *
 * These options must be passed to the component:
 *  - stations
 *  - currentStation
 *  - onStop
 *  - onPlay
 */
var Radio = React.createClass({
    propTypes: {
        stations: React.PropTypes.arrayOf(React.PropTypes.shape({
            id: React.PropTypes.string.isRequired,
            name: React.PropTypes.string.isRequired
        })),
        currentStation: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.oneOf([false])
        ]).isRequired,
        onStop: React.PropTypes.func.isRequired,
        onPlay: React.PropTypes.func.isRequired
    },

    handleStationClick: function(station) {
        if (this.props.currentStation === station.props.id) {
            this.props.onStop();
        } else {
            this.props.onPlay(station.props.id);
        }
    },

    render: function() {
        return (
            <div className="list-group radio">
                {this.props.stations.map(function(station) {
                    return (
                        <RadioStation
                            key={station.id}
                            id={station.id}
                            name={station.name}
                            isPlaying={this.props.currentStation === station.id}
                            clickHandler={this.handleStationClick}
                        />
                    );
                }, this)}
            </div>
        );
    }
});

module.exports = Radio;
