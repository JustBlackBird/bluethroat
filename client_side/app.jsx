require('es6-promise').polyfill();

var React = require('react'),
    ReactDOM = require('react-dom'),
    createStore = require('redux').createStore,
    applyMiddleware = require('redux').applyMiddleware,
    thunk = require('redux-thunk'),
    Provider = require('react-redux').Provider,
    Application = require('./smart_components/application.jsx'),
    reducers = require('./reducers');

/**
 * Initializes client side application.
 *
 * @param {Object} initialState Initial state of the application.
 * @param {Object} rootElement DOM element the application should be added to.
 */
module.exports = function(initialState, rootElement) {
    var store = createStore(reducers, initialState, applyMiddleware(thunk));

    ReactDOM.render(
        <Provider store={store}>
            <Application />
        </Provider>,
        rootElement
    );
};
