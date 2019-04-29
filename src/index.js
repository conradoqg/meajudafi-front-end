import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';
import theme from './util/theme';
import DashboardView from './view/dashboardView';
import * as serviceWorker from './serviceWorker';

const Root = () => (    
    <MuiThemeProvider theme={theme}>
        <DashboardView />
    </MuiThemeProvider>
);

ReactDOM.render(<Root />, document.getElementById('app'));

serviceWorker.register();