/* eslint-disable import/first */
import React from 'react';

// if (process.env.NODE_ENV !== 'production') {
//     const whyDidYouRender = require('@welldone-software/why-did-you-render');
//     whyDidYouRender(React, {
//         trackAllPureComponents: true,
//         trackHooks: true        
//     });
// }

import { setAutoFreeze } from 'immer';
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';
import ErrorBoundary from './view/component/errorBoundary';
import theme from './util/theme';
import DashboardView from './view/dashboardView';
import * as serviceWorker from './serviceWorker';
import * as Sentry from '@sentry/browser';

setAutoFreeze(false);

const Root = () => (
    <MuiThemeProvider theme={theme}>
        <ErrorBoundary>
            <DashboardView />
        </ErrorBoundary>
    </MuiThemeProvider>
);

if (process.env.NODE_ENV === 'production') {
    Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN });
}

ReactDOM.render(<Root />, document.getElementById('app'));

serviceWorker.register();