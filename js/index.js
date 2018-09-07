const React = require('react');
const ReactDOM = require('react-dom');
const AppView = require('./view/appView');

$(document).ready(function () {
    ReactDOM.render(<AppView />, document.getElementById('app'));
});