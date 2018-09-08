require('@babel/polyfill');
const AppView = require('./view/appView');

$(document).ready(function () {
    ReactDOM.render(<AppView />, document.getElementById('app'));
});