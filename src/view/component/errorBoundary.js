import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import * as Sentry from '@sentry/browser';

const styles = theme => ({
    centered: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    },
    centeredImage: {
        verticalAlign: "middle",
        margin: theme.spacing(3)
    }
});

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    componentDidCatch(error, info) {        
        Sentry.withScope(scope => {
            scope.setExtras(info);
            const eventId = Sentry.captureException(error);
            this.setState({ hasError: true, eventId });
        });
    }

    render() {
        const { classes } = this.props;

        if (this.state.hasError) {
            return (
                <div className={classes.centered}>
                    <Typography variant="h6" component="span">
                        <img src="/img/emoticon-cry-outline.png" className={classes.centeredImage} alt="saddiness" />
                        Alguma coisa errada não está certa. Tente novamente ou <Link href="#" onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}>reporte o erro.</Link>
                    </Typography>
                </div>
            );
        } else
            return this.props.children;
    }
}

export default withStyles(styles)(ErrorBoundary);