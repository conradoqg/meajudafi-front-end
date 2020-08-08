import React from 'react';
import ReactDOM from 'react-dom';
import { MuiThemeProvider } from '@material-ui/core/styles';
import ErrorBoundary from './view/component/errorBoundary';
import theme from './util/theme';
import DashboardView from './view/dashboardView';
import * as serviceWorker from './serviceWorker';
import * as Sentry from '@sentry/browser';
import createFetch from 'fetch-retry';

// eslint-disable-next-line no-native-reassign
fetch = createFetch(fetch, {
    retryOn: [404],
    retries: 4,
    retryDelay: function (attempt) {
        return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
    }
});

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