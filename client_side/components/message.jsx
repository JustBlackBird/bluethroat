var React = require('react');

/**
 * A component which represents single message.
 *
 * This is a "dumb" React component.
 *
 * These options must be passed to the component:
 *  - message
 *  - isError
 */
var Message = React.createClass({
    propTypes: {
        message: React.PropTypes.string.isRequired,
        isError: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            isError: false
        };
    },

    render: function() {
        var classNames = 'alert';

        if (this.props.isError) {
            classNames += ' alert-danger';
        } else {
            classNames += ' alert-info';
        }

        return (
            <div className={classNames}>
                {this.props.message}
            </div>
        );
    }
});

module.exports = Message;
