require('@babel/polyfill');
const ReactDOM = require('react-dom');
const React = require('react');
const DashboardView = require('./view/dashboardView');

//$(document).ready(function () {
ReactDOM.render(<DashboardView />, document.getElementById('app'));
//});