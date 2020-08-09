import React, { useState } from 'react';
import useInterval from '@use-it/interval';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import ShowStateComponent from './component/showStateComponent';
import Skeleton from '@material-ui/lab/Skeleton';
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

const useStyles = makeStyles(theme => ({
    appBarSpacer: theme.mixins.toolbar,
    filterPaperContent: {
        padding: theme.spacing(2)
    },
    progressContent: {
        padding: theme.spacing(2)
    },
    progress: {
        margin: theme.spacing(2)
    }
}));

const emptyState = {
    data: {
        data: null,
        lastKnownStart: null,
        lastKnownFinish: null
    }
};

async function updateData(setProgress) {
    const data = await getProgress();

    const cvmDataWorkerProgresss = data.find(item => item.path === 'CVMDataWorker');
    const xpiFundWorkerProgresss = data.find(item => item.path === 'XPIFundWorker');

    setProgress({
        data,
        lastKnownStart: cvmDataWorkerProgresss && cvmDataWorkerProgresss.data.progressTracker.state.start,
        lastKnownFinish: xpiFundWorkerProgresss && xpiFundWorkerProgresss.data.progressTracker.state.finish
    });
}

function getProgress() {
    return API.getProgress();
}

function ProgressView(props) {
    const [progress, setProgress] = useState(emptyState.data);

    useInterval(() => updateData(setProgress), 2000);

    const classes = useStyles();

    return (
        <div>
            <div className={classes.appBarSpacer} />
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Typography variant="h5">Progresso de atualização</Typography>
                        </Grid>
                        <Grid item>
                            <Typography variant="body2">(Último início: {progress.lastKnownStart ? formatters.dateWithTime(progress.lastKnownStart) : 'Desconhecido'} - Último fim: {progress.lastKnownFinish ? formatters.dateWithTime(progress.lastKnownFinish) : 'Desconhecido'})</Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <ShowStateComponent
                        data={progress.data}
                        hasData={() => (<Paper elevation={1} square={true}>
                            <Grid container className={classes.progressContent}>
                                <Grid item>
                                    <Typography variant="body2" style={{ fontFamily: "monospace" }}>
                                        {progress.data.filter(item => item.data.progressTracker.state.start > progress.lastKnownStart).map(item => (<span key={item.path}>{defaultTemplate(item.data.progressTracker, item.data.prettyProgressTracker)}<br /></span>))}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>)}
                        isNull={() => (<Paper elevation={1} square={true}>
                            <Grid container className={classes.progressContent}>
                                <Grid item xs={12} sm={12} md={12} xl={12}>
                                    <Typography variant="body2" style={{ fontFamily: "monospace" }} component="span" display="block">
                                        {[...Array(10).keys()].map(item => (<Skeleton key={item} />))}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>)}
                        isErrored={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                        isEmpty={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Sem dados à exibir</Typography></Paper>)}
                    />
                </Grid>
            </Grid>
        </div >
    );
}

export default ProgressView;