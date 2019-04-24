import React from 'react';
import ReactDOM from 'react-dom';
import DashboardView from './view/dashboardView';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<DashboardView />, document.getElementById('app'));

serviceWorker.register();