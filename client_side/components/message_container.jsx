var React = require('react'),
    Message = require('./message.jsx');

/**
 * A component which represents whole message contaiter.
 *
 * This is a "dumb" React component.
 *
 * These options must be passed to the component:
 *  - messages
 */
var MessageContainer = React.createClass({
    propTypes: {
        messages: React.PropTypes.array
    },

    getDefaultProps: function() {
        return {
            messages: []
        };
    },

    render: function() {
        return (
            <div className="message-container">
                {this.props.messages.map(function(message) {
                    return <Message isError={message.isError} message={message.message} key={message.id} />
                }, this)}
            </div>
        );
    }
});

module.exports = MessageContainer;
