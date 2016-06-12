var React = require('react');

/**
 * A component for single station item.
 *
 * This is a "dumb" React component.
 *
 * These options must be passed to the component:
 *  - id
 *  - name
 *  - isPlaying
 */
module.exports = React.createClass({
    propTypes: {
        id: React.PropTypes.string.isRequired,
        name: React.PropTypes.string.isRequired,
        isPlaying: React.PropTypes.bool.isRequired,
        clickHandler: React.PropTypes.func.isRequired
    },

    handleClick: function() {
        this.props.clickHandler(this);
    },

    getGlyphClasses: function() {
        var classes = 'glyphicon';

        if (this.props.isPlaying) {
            classes += ' glyphicon-stop';
        } else {
            classes += ' glyphicon-play';
        }

        return classes + ' pull-right';
    },

    getLinkClasses: function() {
        var classes = 'list-group-item';

        if (this.props.isPlaying) {
            classes += ' active';
        }

        return classes + ' radio-station';
    },

    render: function() {
        return (
            <a className={this.getLinkClasses()} onClick={this.handleClick}>
                {this.props.name} <span className={this.getGlyphClasses()}></span>
            </a>
        );
    }
});
