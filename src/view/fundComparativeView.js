import React from 'react';
import Plotly from '../vendor/plotly';
import createPlotlyComponent from 'react-plotly.js/factory';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Paper from '@material-ui/core/Paper';
import promisesEach from 'promise-results';
import { withRouter } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import { produce } from 'immer';
import { formatters, chartFormatters } from '../util';
import ShowStateComponent from './component/showStateComponent';
import API from '../api';

const Plot = createPlotlyComponent(Plotly);

const styles = theme => ({
    select: {
        margin: theme.spacing.unit
    },
    chart: {
        padding: theme.spacing.unit * 2
    },
    withTooltip: theme.withTooltip,
    appBarSpacer: theme.mixins.toolbar,
});

const emptyState = {
    data: {
        chart: {
            data: [],
            layout: {},
            frames: []
        }
    }
};

class FundComparativeView extends React.Component {
    state = emptyState

    async componentDidMount() {
        this.updateChart(this.state);
    }

    handleChartClick = (data) => {
        this.props.history.push('/funds/' + data.points[0].data.id[data.points[0].pointIndex]);
    }

    updateChart = async (nextState) => {
        this.setState(produce(nextState, draft => {
            draft.data.chart = null;
        }));

        const { fundsTimeseries } = await promisesEach({
            fundsTimeseries: this.getFundsTimeseries()
        })

        nextState = produce(nextState, draft => {
            draft.data.chart = this.buildChart(fundsTimeseries);
        });

        this.setState(nextState);
    }

    buildChart = (data) => {
        // Create a lookup table to sort and regroup the columns of data,
        // first by irm_dt_comptc, then by icf_classe:
        const lookup = {};
        function getData(irm_dt_comptc, icf_classe) {
            let byIRM_dt_comptc = null;
            let trace = null;

            if (!(byIRM_dt_comptc = lookup[irm_dt_comptc])) {
                byIRM_dt_comptc = lookup[irm_dt_comptc] = {};
            }
            // If a container for this irm_dt_comptc + icf_classe doesn't exist yet,
            // then create one:
            if (!(trace = byIRM_dt_comptc[icf_classe])) {
                trace = byIRM_dt_comptc[icf_classe] = {
                    x: [],
                    y: [],
                    id: [],
                    text: [],
                    marker: { size: [] }
                };
            }
            return trace;
        }

        let xRange = [0, 0];
        let yRange = [0, 0];
        let sizeRange = [0, 0];

        // Go through each row, get the right trace, and append the data:
        for (var i = 0; i < data.length; i++) {
            const datum = data[i];
            const trace = getData(datum.irm_dt_comptc, formatters.field['icf_classe'](datum.icf_classe));
            const xValue = datum.irm_risk_1y;
            const yValue = datum.irm_investment_return_1y;
            const sizeValue = datum.irm_accumulated_networth;

            xRange = [Math.min(xRange[0], xValue), Math.max(xRange[1], xValue)];
            yRange = [Math.min(yRange[0], yValue), Math.max(yRange[1], yValue)];
            sizeRange = [Math.min(sizeRange[0], sizeValue), Math.max(sizeRange[1], sizeValue)];

            trace.text.push(datum.f_name);
            trace.id.push(datum.f_cnpj);
            trace.x.push(xValue);
            trace.y.push(yValue);
            trace.marker.size.push(sizeValue);
        }

        // Get the group names:
        var irm_dt_comptcs = Object.keys(lookup);
        // In this case, every irm_dt_comptc includes every icf_classe, so we
        // can just infer the icf_classes from the *first* irm_dt_comptc:
        var firstIRM_dt_comptc = lookup[irm_dt_comptcs[0]];
        const icf_classes = Object.keys(firstIRM_dt_comptc);

        // Create the main traces, one for each icf_classe:
        var traces = [];
        for (i = 0; i < icf_classes.length; i++) {
            let data = firstIRM_dt_comptc[icf_classes[i]];
            // One small note. We're creating a single trace here, to which
            // the frames will pass data for the different irm_dt_comptcs. It's
            // subtle, but to avoid data reference problems, we'll slice
            // the arrays to ensure we never write any new data into our
            // lookup table:
            traces.push({
                name: icf_classes[i],
                x: data.x.slice(),
                y: data.y.slice(),
                id: data.id.slice(),
                text: data.text.slice(),
                mode: 'markers',
                marker: {
                    size: data.marker.size.slice(),
                    sizemode: 'area',
                    sizeref: 10000000
                },
                hovertemplate:
                    "<b>%{text}</b><br><br>" +
                    "%{yaxis.title.text}: %{y:.2%}<br>" +
                    "%{xaxis.title.text}: %{x:.2%}<br>" +
                    "Patrimônio: " + chartFormatters.networth.tickprefix + "%{marker.size:" + chartFormatters.networth.hoverformat + "}" +
                    "<extra></extra>"
            });
        }

        // Create a frame for each irm_dt_comptc. Frames are effectively just
        // traces, except they don't need to contain the *full* trace
        // definition (for example, appearance). The frames just need
        // the parts the traces that change (here, the data).
        const frames = [];
        for (i = 0; i < irm_dt_comptcs.length; i++) {
            frames.push({
                name: irm_dt_comptcs[i],
                // eslint-disable-next-line no-loop-func
                data: icf_classes.map(icf_classe => getData(irm_dt_comptcs[i], formatters.field['icf_classe'](icf_classe)))
            });
        }

        // Now create slider steps, one for each frame. The slider
        // executes a plotly.js API command (here, Plotly.animate).
        // In this example, we'll animate to one of the named frames
        // created in the above loop.
        var sliderSteps = [];
        for (i = 0; i < irm_dt_comptcs.length; i++) {
            sliderSteps.push({
                method: 'animate',
                label: formatters.month(irm_dt_comptcs[i]),
                args: [[irm_dt_comptcs[i]], {
                    mode: 'immediate',
                    transition: { duration: 300 },
                    frame: { duration: 300, redraw: false },
                }]
            });
        }

        var layout = {
            xaxis: {
                title: 'Risco',
                tickformat: '.0%',
                hoverformat: '.2%',
                range: xRange
            },
            yaxis: {
                title: 'Performance',
                tickformat: '.0%',
                hoverformat: '.2%',
                range: yRange
            },
            hovermode: 'closest',
            // We'll use updatemenus (whose functionality includes menus as
            // well as buttons) to create a play button and a pause button.
            // The play button works by passing `null`, which indicates that
            // Plotly should animate all frames. The pause button works by
            // passing `[null]`, which indicates we'd like to interrupt any
            // currently running animations with a new list of frames. Here
            // The new list of frames is empty, so it halts the animation.
            updatemenus: [{
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: { t: 87, r: 10 },
                buttons: [{
                    method: 'animate',
                    args: [null, {
                        mode: 'immediate',
                        fromcurrent: true,
                        transition: { duration: 300 },
                        frame: { duration: 500, redraw: false }
                    }],
                    label: 'Continua'
                }, {
                    method: 'animate',
                    args: [[null], {
                        mode: 'immediate',
                        transition: { duration: 0 },
                        frame: { duration: 0, redraw: false }
                    }],
                    label: 'Pausa'
                }]
            }],
            // Finally, add the slider and use `pad` to position it
            // nicely next to the buttons.
            sliders: [{
                pad: { l: 170, t: 55 },
                currentvalue: {
                    visible: true,
                    prefix: 'Data: ',
                    xanchor: 'right',
                    font: { size: 20, color: '#666' }
                },
                steps: sliderSteps
            }]
        };

        // Create the plot:
        return {
            data: traces,
            layout: layout,
            frames: frames,
        };
    }

    getFundsTimeseries = async () => {
        return API.getFundsTimeseries();
    }

    render() {
        const { classes } = this.props;

        return (
            <React.Fragment>
                <div className={classes.appBarSpacer} />
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Comparativo de fundos de investimento sobre o tempo.</p>
                                        <p>No lado direito é possível alterar o benchmark e intervalo visualizado.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h5" className={classes.withTooltip}>Comparativo de Fundos</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    {/* <Grid item>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Select
                                    value={this.state.config.benchmark}
                                    onChange={this.handleConfigBenchmarkChange}
                                    className={classes.select}
                                    inputProps={{
                                        name: 'benchmark',
                                        id: 'benchmark',
                                    }}>
                                    {benchmarkOptions.map(benchmark => (<MenuItem key={benchmark.name} value={benchmark.name}>{benchmark.displayName}</MenuItem>))}
                                </Select>
                            </Grid>
                            <Grid item>
                                <Select
                                    value={this.state.config.range}
                                    onChange={this.handleConfigRangeChange}
                                    className={classes.select}
                                    inputProps={{
                                        name: 'range',
                                        id: 'range',
                                    }}>
                                    {rangeOptions.filter(range => range.name !== 'best').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                                </Select>
                            </Grid>
                        </Grid>
                    </Grid> */}
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            <ShowStateComponent
                                data={this.state.data.chart}
                                hasData={() => (
                                    <Plot
                                        data={this.state.data.chart.data}
                                        layout={this.state.data.chart.layout}
                                        frames={this.state.data.chart.frames}
                                        onClick={this.handleChartClick}
                                        useResizeHandler={true}
                                        style={{ width: '100%', height: '800px' }}
                                    />
                                )}
                                isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress /></Typography>)}
                                isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </React.Fragment>
        );
    }
}

export default withStyles(styles)(withRouter(FundComparativeView));