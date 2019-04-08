import React from 'react';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import CircularProgress from '@material-ui/core/CircularProgress';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import Grey from '@material-ui/core/colors/grey';
import { withStyles } from '@material-ui/core/styles';
import { produce, setAutoFreeze } from 'immer';
import * as d3Format from 'd3-format';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly';
import promisesEach from 'promise-results';
import { withRouter } from 'react-router-dom';
import API from '../api';
import FundSearchComponent from './components/fundSearchComponent';
import ShowStateComponent from './components/showStateComponent';
import { fieldOptions, sortOptions, benchmarkOptions, rangeOptions } from './options';
import { nextColorIndex } from '../util';

setAutoFreeze(false);
const Plot = createPlotlyComponent(Plotly);

const styles = theme => ({
    optionsBar: {
        padding: theme.spacing.unit
    },
    progress: {
        margin: theme.spacing.unit * 2
    },
    select: {
        margin: theme.spacing.unit
    },
    chart: {
        padding: theme.spacing.unit * 2
    },
    help: {
        margin: 10,
        backgroundColor: Grey[600],
        width: 17,
        height: 17,
        fontSize: 10,
        fontWeight: 'bold'
    }
});

const emptyState = {
    data: {
        fundListSearch: [],
        fundListCompare: [],
        benchmark: {
            name: benchmarkOptions.find(benchmark => benchmark.name == 'cdi').displayName,
            data: null
        },
        sortOptions: sortOptions,
        chart: null
    },
    config: {
        page: 0,
        rowsPerPage: 5,
        sort: sortOptions[0],
        search: FundSearchComponent.emptyState.config.search,
        searchRevision: 0,
        benchmark: 'bovespa',
        range: '1y',
        field: 'investment_return'
    }
};

class FundListItemView extends React.Component {
    state = emptyState;

    constructor(props) {
        super(props);

        // this.state.data.benchmark.name = benchmarkOptions.find(benchmark => benchmark.name == this.state.config.benchmark).displayName;
        // this.state.data.fundListCompare = props.match.params.cnpjs ? props.match.params.cnpjs.split('/').map(cnpj => { return { cnpj, detail: null, data: null }; }) : emptyState.data.fundListCompare;
        // this.state.config.range = (typeof (props.match.params.range) != 'undefined') ? props.match.params.range : this.state.config.range;
        // this.state.config.benchmark = (typeof (props.match.params.benchmark) != 'undefined') ? props.match.params.benchmark : this.state.config.benchmark;
        // this.state.config.field = (typeof (props.match.params.field) != 'undefined') ? props.match.params.field : this.state.config.field;

        // this.replaceHistory(this.state);
    }

    async componentDidMount() {
        // return this.updateData(this.state);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // const locationChanged = this.props.location !== nextProps.location;

        // if (locationChanged) {
        //     if (this.props.history.action == 'POP') {
        //         this.updateData(nextProps.history.location.state);
        //     }
        // }
    }

    handleConfigFieldChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.chart = null;
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    handleConfigRangeChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.fundListCompare = draft.data.fundListCompare.map(fund => {
                fund.data = null;
                return fund;
            });
            draft.data.benchmark.data = null;
            draft.data.chart = null;
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    handleConfigBenchmarkChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.fundListCompare = draft.data.fundListCompare.map(fund => {
                fund.data = null;
                return fund;
            });
            draft.data.benchmark = {
                name: benchmarkOptions.find(benchmark => benchmark.name == event.target.value).displayName,
                data: null
            };
            draft.data.chart = null;
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    handleChartInitialized = async (figure) => {
        this.setState(produce(draft => {
            draft.data.chart = figure;
        }));
    }

    handleChartUpdate = async (fund, figure) => {
        this.setState(produce(draft => {
            draft.data.chart = figure;
        }));
    }

    handleRemoveClick = async (fund) => {
        const nextState = produce(this.state, draft => {
            draft.data.fundListCompare = draft.data.fundListCompare.filter(fundItem => fundItem.cnpj != fund.cnpj);
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    buildHistoryPath(nextState) {
        return this.props.basePath + '/' + nextState.config.benchmark + '/' + nextState.config.range + '/' + nextState.config.field + (nextState.data.fundListCompare ? '/' + nextState.data.fundListCompare.map(fund => fund.cnpj).join('/') : '');
    }


    replaceHistory(nextState) {
        this.props.history.replace(this.buildHistoryPath(nextState), nextState);
    }

    pushHistory(nextState) {
        this.props.history.push(this.buildHistoryPath(nextState), nextState);
    }

    async updateData(nextState) {

        const benchmarkToUpdate = nextState.data.benchmark && nextState.data.benchmark.data == null ? nextState.data.benchmark : null;
        const fundsToUpdate = nextState.data.fundListCompare.filter(fund => fund.data == null);

        this.setState(produce(nextState, draft => {
            draft.data.chart = null;
        }));

        let promises = {};
        fundsToUpdate.map(fund => {
            promises[fund.cnpj] = promisesEach({ detail: this.getFundData(fund.cnpj), data: this.getFundStatistic(fund.cnpj, nextState.config) });
        });
        promises.benchmark = benchmarkToUpdate ? this.getBenchmarkStatistic(nextState.config) : null;

        let results = await promisesEach(promises);

        nextState = produce(nextState, draft => {
            if (results.benchmark) {
                if (results.benchmark instanceof Error) draft.data.benchmark.data = results.benchmark.message;
                else draft.data.benchmark.data = results.benchmark;
            }

            draft.data.fundListCompare = draft.data.fundListCompare.map(fund => {
                if (results[fund.cnpj]) {
                    if (results[fund.cnpj].data instanceof Error) fund.data = results[fund.cnpj].data.message;
                    else fund.data = results[fund.cnpj].data;

                    // TODO: getFundData should return the result or throw error
                    if (results[fund.cnpj].detail.length == 0) fund.detail = 'Não encontrado';
                    else {
                        fund.detail = {
                            name: results[fund.cnpj].detail[0].f_short_name,
                            benchmark: results[fund.cnpj].detail[0].rentab_fundo
                        };
                    }
                }

                return fund;
            });

            draft.data.chart = this.buildChart(draft.config.field, draft.data.benchmark, draft.data.fundListCompare);
        });
        this.setState(nextState);
    }

    buildChart = (field, benchmark, fundList) => {
        let chartData = [];
        let colorIndex = 0;

        if (benchmark) {
            chartData.push({
                x: benchmark.data.date,
                y: (field == 'relative_investment_return' || field == 'correlation' || field == 'sharpe' ? (new Array(benchmark.data.date.length)).fill(field == 'sharpe' ? 0 : 1) : benchmark.data[field]),
                type: 'scatter',
                mode: 'lines',
                name: benchmark.name,
                line: { color: nextColorIndex(colorIndex++) }
            });
        }

        if (fundList) {
            chartData = chartData.concat(fundList.map(fund => {
                return {
                    x: fund.data.date,
                    y: fund.data[field],
                    type: 'scatter',
                    mode: 'lines',
                    name: fund.detail.name,
                    line: { color: nextColorIndex(colorIndex++) }
                };
            }));
        }

        const chart = {
            data: chartData,
            layout: {
                separators: ',.',
                autosize: true,
                showlegend: true,
                xaxis: {
                    showspikes: true,
                    spikemode: 'across'
                },
                yaxis: {
                    title: 'Desempenho',
                    tickformat: ',.0%',
                    hoverformat: ',.2%'
                }
            }
        };

        return chart;
    }

    async getBenchmarkStatistic(config) {
        const from = rangeOptions.find(range => range.name == config.range).toDate();

        return API.getBenchmarkStatistic(config.benchmark, from);
    }

    async getFundData(cnpj) {
        return API.getFundData(cnpj);
    }

    async getFundList(config) {
        return API.getFundList(config);
    }

    async getFundStatistic(cnpj, config) {
        const from = rangeOptions.find(range => range.name == config.range).toDate();

        return API.getFundStatistic(cnpj, config.benchmark, from);
    }

    render() {
        const { globalClasses, classes } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="display1" gutterBottom>Nome do fundo</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Comparador de desempenho de fundos.</p>
                                <p>No lado direito é possível alterar o benchmark e intervalo visualizado.</p>
                                <p>Procure um fundo e o adicione na lista para inicar a comparação.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                    <Grid container justify="flex-end">
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
                            <Select
                                value={this.state.config.range}
                                onChange={this.handleConfigRangeChange}
                                className={classes.select}
                                inputProps={{
                                    name: 'range',
                                    id: 'range',
                                }}>
                                {rangeOptions.filter(range => range.name != 'all').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                            </Select>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Informações Gerais</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            <Grid container spacing={16}>                                
                                <Grid item xs={12}>
                                    <Typography variant="subheading" gutterBottom>CVM</Typography>
                                </Grid>
                            </Grid>
                            <Grid container spacing={16}>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>

                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                            </Grid>
                            <Grid container spacing={16}>
                                <Grid item xs={12}>
                                    <Divider variant="middle" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subheading" gutterBottom>XP Investimentos</Typography>
                                </Grid>
                            </Grid>
                            <Grid container spacing={16}>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>

                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                            </Grid>
                            <Grid container spacing={16}>
                                <Grid item xs={12}>
                                    <Divider variant="middle" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subheading" gutterBottom>BTG Pactual</Typography>
                                </Grid>
                            </Grid>
                            <Grid container spacing={16}>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>

                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                                <Grid item xs={3}><b>CNPJ:</b> adasdadas</Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
                <br />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Gráfico Histórico</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Lista de melhores e piores fundos de investimento. </p>
                                <p>Por padrão somente fundos listados na BTG Pactual e XP Investimentos são exibidos. No lado direito é possível alterar o filtro.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            `Chart`
                        </Paper>
                    </Grid>
                </Grid>
                <br />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Tabela Histórica</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Lista de melhores e piores fundos de investimento. </p>
                                <p>Por padrão somente fundos listados na BTG Pactual e XP Investimentos são exibidos. No lado direito é possível alterar o filtro.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                    <Select
                        value={this.state.config.field}
                        onChange={this.handleConfigFieldChange}
                        className={classes.select}
                        inputProps={{
                            name: 'field',
                            id: 'field',
                        }}>
                        {fieldOptions.map(field => (<MenuItem key={field.name} value={field.name}>{field.displayName}</MenuItem>))}
                    </Select>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart}>
                            <table style={{ width: '100%', textAlign: 'center', padding: '5px' }}>
                                <thead>
                                    <tr style={{ padding: '5px' }}>
                                        <th style={{ padding: '5px' }}>ano</th>
                                        <th>jan</th>
                                        <th>fev</th>
                                        <th>mar</th>
                                        <th>abr</th>
                                        <th>mai</th>
                                        <th>jun</th>
                                        <th>jul</th>
                                        <th>ago</th>
                                        <th>set</th>
                                        <th>out</th>
                                        <th>nov</th>
                                        <th>dez</th>
                                        <th>ano</th>
                                        <th>accumulado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ padding: '5px' }}>
                                        <th style={{ padding: '5px' }}>2017</th>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                    </tr>
                                    <tr>
                                        <th>2018</th>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                        <td>12,24%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Paper>
                    </Grid>
                </Grid>
            </div >
        );
    }
}

module.exports = withStyles(styles)(withRouter(FundListItemView));