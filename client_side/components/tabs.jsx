var React = require('react');

/**
 * A component for nav tabs.
 *
 * This is a "dumb" React component.
 *
 * These options must be passed to the component:
 *  - activeTab
 *  - items
 *  - onChange
 */
var Tabs = React.createClass({
    propTypes: {
        activeTab: React.PropTypes.number.isRequired,
        items: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
        onChange: React.PropTypes.func.isRequired
    },

    handleTabClick: function(id) {
        if (id === this.props.activeTab) {
            return;
        }

        this.props.onChange(id);
    },

    render: function() {
        var renderTab = function(title, index) {
            var classes = this.props.activeTab === index ? 'active' : '';

            return (
                <li key={index} className={classes}>
                    <a onClick={this.handleTabClick.bind(this, index)}>{title}</a>
                </li>
            );
        }.bind(this);

        return (
            <ul className="nav nav-pills">{this.props.items.map(renderTab)}</ul>
        );
    }
});

module.exports = Tabs;
