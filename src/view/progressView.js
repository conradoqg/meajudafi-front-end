import React from 'react';
import Grid from '@material-ui/core/Grid';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { produce } from 'immer';
import { withRouter } from 'react-router-dom';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ShowStateComponent from './component/showStateComponent';
import CircularProgress from '@material-ui/core/CircularProgress';
import { formatters } from '../util';
import API from '../api';

const defaultTemplate = (progressTracker, prettyProgress) => {
    if (progressTracker.state.status === 'new')
        return `${progressTracker.id}: starting`;
    else if (progressTracker.state.status === 'running') {
        if (progressTracker.state.total != null) return `${progressTracker.id}: [${prettyProgress.state.percentageBar}] ${prettyProgress.state.current}/${prettyProgress.state.total} (${prettyProgress.state.percentage}%) - elapsed: ${prettyProgress.state.elapsed} - speed: ${prettyProgress.state.speed} - eta: ${prettyProgress.state.eta}`;
        else return `${progressTracker.id}: running`;
    } else if (progressTracker.state.status === 'ended') {
        if (progressTracker.state.total != null) return `${progressTracker.id}: took ${prettyProgress.state.elapsed} at ${prettyProgress.state.speed} for ${prettyProgress.state.current}`;
        else return `${progressTracker.id}: took ${prettyProgress.state.elapsed}`;
    } else if (progressTracker.state.status === 'errored') {
        if (progressTracker.state.total != null) return `${progressTracker.id}: failed at ${prettyProgress.state.current} after ${prettyProgress.state.elapsed}`;
        else return `${progressTracker.id}: failed after ${prettyProgress.state.elapsed}`;
    }
};

const styles = theme => ({
    appBarSpacer: theme.mixins.toolbar,
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
    progressContent: {
        padding: theme.spacing.unit * 2
    },
    progress: {
        margin: theme.spacing.unit * 2
    }
});

const emptyState = {
    data: {
        progress: null,
        lastKnownStart: null,
        lastKnownFinish: null
    }
};

class ProgressView extends React.Component {
    state = emptyState;
    interval = null;

    async componentDidMount() {
        this.interval = setInterval(() => this.updateData(this.state), 2000);
    }

    async componentWillUnmount() {
        this.interval && clearInterval(this.interval);
    }

    updateData = async (nextState) => {
        const progress = await this.getProgress();

        const cvmDataWorkerProgresss = progress.find(item => item.path === 'CVMDataWorker');
        const xpiFundWorkerProgresss = progress.find(item => item.path === 'XPIFundWorker');


        this.setState(produce(nextState, draft => {
            draft.data.progress = progress;
            draft.data.lastKnownStart = cvmDataWorkerProgresss && cvmDataWorkerProgresss.data.progressTracker.state.start;
            draft.data.lastKnownFinish = xpiFundWorkerProgresss && xpiFundWorkerProgresss.data.progressTracker.state.finish;
        }));
    }

    getProgress = async () => {
        return API.getProgress();
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Typography variant="h5">Progresso de atualização</Typography>
                            </Grid>
                            <Grid item>
                                <Typography variant="body">(Último início: {this.state.data.lastKnownStart ? formatters.date(this.state.data.lastKnownStart) : 'Desconhecido'} - Último fim: {this.state.data.lastKnownFinish ? formatters.date(this.state.data.lastKnownFinish) : 'Desconhecido'})</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <ShowStateComponent
                            data={this.state.data.progress}
                            hasData={() => (<Paper elevation={1} square={true}>
                                <Grid container className={classes.progressContent}>
                                    <Grid item>
                                        <Typography style={{ fontFamily: "monospace" }}>
                                            {this.state.data.progress.filter(item => item.data.progressTracker.state.start > this.state.data.lastKnownStart).map(item => (<span key={item.path}>{defaultTemplate(item.data.progressTracker, item.data.prettyProgressTracker)}<br /></span>))}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>)}
                            isNull={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography></Paper>)}
                            isErrored={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                            isEmpty={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Sem dados à exibir</Typography></Paper>)}
                        />
                    </Grid>
                </Grid>
            </div >
        );
    }
}

export default withWidth()(withStyles(styles)(withRouter(ProgressView)));