import React from 'react';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import CircularProgress from '@material-ui/core/CircularProgress';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Hidden from '@material-ui/core/Hidden';
import { produce } from 'immer';
import promisesEach from 'promise-results';
import { withRouter } from 'react-router-dom';
import API from '../api';
import FundSearchComponent from './component/fundSearchComponent';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import { fieldOptions, sortOptions, benchmarkOptions, rangeOptions } from './option';
import { formatters, nextColorIndex, chartFormatters } from '../util';

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
    withTooltip: theme.withTooltip,
    link: theme.link,
    appBarSpacer: theme.mixins.toolbar,
    button: {
        [theme.breakpoints.down('md')]: {
            padding: '0px',
            margin: '0px',
        }
    },
    benchmarkCell: {
        marginTop: '10px',
        marginBottom: '10px'
    }
});

const emptyState = {
    data: {
        fundListSearch: [],
        fundListCompare: [],
        benchmark: {
            name: benchmarkOptions.find(benchmark => benchmark.name === 'cdi').displayName,
            data: null
        },
        sortOptions: sortOptions,
        chartSmall: null,
        chartLarge: null
    },
    config: {
        page: 0,
        rowsPerPage: 5,
        sort: sortOptions[0],
        search: FundSearchComponent.emptyState.config.search,
        searchRevision: 0,
        benchmark: 'cdi',
        range: '1y',
        field: 'investment_return'
    }
};

class FundComparisonView extends React.Component {
    state = emptyState;

    constructor(props) {
        super(props);

        this.state = produce(this.state, draft => {
            draft.data.benchmark.name = benchmarkOptions.find(benchmark => benchmark.name === this.state.config.benchmark).displayName;
            draft.data.fundListCompare = props.match.params.cnpjs ? props.match.params.cnpjs.split('/').map(cnpj => { return { cnpj, detail: null, data: null }; }) : emptyState.data.fundListCompare;
            draft.config.range = (typeof (props.match.params.range) != 'undefined') ? props.match.params.range : this.state.config.range;
            draft.config.benchmark = (typeof (props.match.params.benchmark) != 'undefined') ? props.match.params.benchmark : this.state.config.benchmark;
            draft.config.field = (typeof (props.match.params.field) != 'undefined') ? props.match.params.field : this.state.config.field;
        });

        this.replaceHistory(this.state);
    }

    async componentDidMount() {
        return this.updateData(this.state);
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const locationChanged = this.props.location !== nextProps.location;

        if (locationChanged) {
            if (this.props.history.action === 'POP') {
                this.updateData(nextProps.history.location.state);
            }
        }
    }

    handleConfigFieldChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
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
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
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
                name: benchmarkOptions.find(benchmark => benchmark.name === event.target.value).displayName,
                data: null
            };
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    handleSearchChange = async (search) => {
        const nextState = produce(this.state, draft => {
            draft.config.search = search;
        });

        this.setState(produce(draft => {
            draft.data.fundListSearch = null;
        }));

        try {
            if (search.term !== '') {
                const result = await this.getFundList(nextState.config);

                this.setState(produce(nextState, draft => {
                    draft.data.fundListSearch = result.data;
                }));
            } else {
                this.setState(produce(nextState, draft => {
                    draft.data.fundListSearch = emptyState.data.fundListSearch;
                }));
            }
        } catch (ex) {
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundListSearch = ex.message;
            }));
        }
    }

    handleAddClick = async (fund) => {
        const nextState = produce(this.state, draft => {
            draft.config.searchRevision = draft.config.searchRevision + 1;
            draft.data.fundListSearch = emptyState.data.fundListSearch;
            if (!draft.data.fundListCompare.find(existingFund => existingFund.cnpj === fund.icf_cnpj_fundo)) {
                draft.data.fundListCompare.push({
                    cnpj: fund.icf_cnpj_fundo,
                    data: null
                });
            }
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    handleChartInitialized = async (figure) => {
        this.setState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.chartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.chartLarge = figure;
        }));
    }

    handleChartUpdate = async (figure) => {
        this.setState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.chartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.chartLarge = figure;
        }));
    }

    handleRemoveClick = async (fund) => {
        const nextState = produce(this.state, draft => {
            draft.data.fundListCompare = draft.data.fundListCompare.filter(fundItem => fundItem.cnpj !== fund.cnpj);
        });
        this.pushHistory(nextState);
        return this.updateData(nextState);
    }

    buildHistoryPath = (nextState) => {
        return this.props.basePath + '/' + nextState.config.benchmark + '/' + nextState.config.range + '/' + nextState.config.field + (nextState.data.fundListCompare ? '/' + nextState.data.fundListCompare.map(fund => fund.cnpj).join('/') : '');
    }


    replaceHistory = (nextState) => {
        this.props.history.replace(this.buildHistoryPath(nextState), nextState);
    }

    pushHistory = (nextState) => {
        this.props.history.push(this.buildHistoryPath(nextState), nextState);
    }

    updateData = async (nextState) => {

        const benchmarkToUpdate = nextState.data.benchmark && nextState.data.benchmark.data == null ? nextState.data.benchmark : null;
        const fundsToUpdate = nextState.data.fundListCompare.filter(fund => fund.data == null);

        this.setState(produce(nextState, draft => {
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        }));

        let promises = {};
        fundsToUpdate.forEach(fund => {
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

                    if (results[fund.cnpj].detail.length === 0) fund.detail = 'Não encontrado';
                    else {
                        fund.detail = {
                            name: results[fund.cnpj].detail[0].f_short_name,
                            benchmark: results[fund.cnpj].detail[0].icf_rentab_fundo
                        };
                    }
                }

                return fund;
            });

            if (results.benchmark instanceof Error) {
                draft.data.chartSmall = results.benchmark;
                draft.data.chartLarge = results.benchmark;
            } else {
                draft.data.chartSmall = this.buildChart(draft.config.field, draft.data.benchmark, draft.data.fundListCompare, 'small');
                draft.data.chartLarge = this.buildChart(draft.config.field, draft.data.benchmark, draft.data.fundListCompare, 'large');
            }
        });
        this.setState(nextState);
    }

    buildChart = (field, benchmark, fundList, size = 'small') => {
        let chartData = [];
        let colorIndex = 0;

        let margin = null;
        if (size === 'large') margin = { l: 60, r: 0, t: 50, b: 40 };
        else margin = { l: 15, r: 15, t: 50, b: 10 };

        if (benchmark) {
            chartData.push({
                x: benchmark.data.daily.date,
                y: (field === 'relative_investment_return' || field === 'correlation' || field === 'sharpe' || field === 'consistency' ? (new Array(benchmark.data.daily.date.length)).fill(field === 'sharpe' ? 0 : 1) : benchmark.data.daily[field]),
                type: 'scatter',
                mode: 'lines',
                name: benchmark.name,
                line: { color: nextColorIndex(colorIndex++) }
            });
        }

        if (fundList) {
            chartData = chartData.concat(fundList.map(fund => {
                return {
                    x: fund.data.daily.date,
                    y: fund.data.daily[field],
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
                legend: { 'orientation': size === 'small' ? 'h' : 'v' },
                size,
                font: {
                    family: '"Roboto", "Helvetica", "Arial", sans-serif'
                },
                dragmode: size === 'small' ? false : 'zoom',
                margin,
                xaxis: {
                    showspikes: true,
                    spikemode: 'across',
                    fixedrange: size === 'small' ? true : false
                },
                yaxis: {
                    title: fieldOptions.find(fieldItem => fieldItem.name === field).displayName,
                    tickformat: chartFormatters[field].tickformat,
                    hoverformat: chartFormatters[field].hoverformat,
                    visible: size === 'small' ? false : true,
                    fixedrange: true
                }
            },
            frames: [],
            config: {
                locale: 'pt-BR',
                displayModeBar: true
            }
        };

        return chart;
    }

    getBenchmarkStatistic = async (config) => {
        const from = rangeOptions.find(range => range.name === config.range).toDate();

        return API.getBenchmarkStatistic(config.benchmark, from);
    }

    getFundData = async (cnpj) => {
        return API.getFundData(cnpj);
    }

    getFundList = async (config) => {
        return API.getFundList(config);
    }

    getFundStatistic = async (cnpj, config) => {
        const from = rangeOptions.find(range => range.name === config.range).toDate();

        return API.getFundStatistic(cnpj, config.benchmark, from);
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
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Comparador de desempenho de fundos.</p>
                                        <p>No lado direito é possível alterar o benchmark e intervalo visualizado.</p>
                                        <p>Procure um fundo e o adicione na lista para inicar a comparação.</p>
                                    </React.Fragment>
                                }><Typography variant="h5" className={classes.withTooltip}>Comparação de Fundos</Typography></Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
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
                                    {rangeOptions.filter(range => range.name !== 'all').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                                </Select>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} >
                            <Grid container wrap="nowrap" className={classes.optionsBar}>
                                <FundSearchComponent key={this.state.config.searchRevision} term={this.state.config.search.term} onSearchChanged={this.handleSearchChange} />
                            </Grid>
                        </Paper>
                        <ShowStateComponent
                            data={this.state.data.fundListSearch}
                            hasData={() => (
                                <Paper elevation={1} square={true} className={classes.optionsBar}>
                                    {
                                        this.state.data.fundListSearch.map((fund, index) => (
                                            <Grid container spacing={8} key={index} alignItems="center" justify="center">
                                                <Grid item xs={7}>
                                                    <Typography>
                                                        <b><Link to={'/funds/' + fund.f_cnpj} className={classes.link}>{fund.f_short_name}</Link></b><br />
                                                        <small>
                                                            <b>Patrimônio:</b> {formatters.field['iry_accumulated_networth'](fund.iry_accumulated_networth)}<br />
                                                            <b>Quotistas:</b> {fund.iry_accumulated_quotaholders} <br />
                                                            <b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](fund.icf_rentab_fundo)}
                                                        </small>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Grid container spacing={8}>
                                                        <Grid item xs={6}>
                                                            <Typography><b>Desempenho</b></Typography>
                                                        </Grid>
                                                        <Hidden smDown>
                                                            <Grid item xs={6}>
                                                                <Typography><b>Risco</b></Typography>
                                                            </Grid>
                                                        </Hidden>
                                                    </Grid>
                                                    <Grid container spacing={8}>
                                                        <Grid item sm={6} xs={12}>
                                                            <Typography>
                                                                <small>
                                                                    1A: {formatters.field['iry_investment_return_1y'](fund.iry_investment_return_1y)}<br />
                                                                    2A: {formatters.field['iry_investment_return_2y'](fund.iry_investment_return_2y)}<br />
                                                                    3A: {formatters.field['iry_investment_return_3y'](fund.iry_investment_return_3y)}
                                                                </small>
                                                            </Typography>
                                                        </Grid>
                                                        <Hidden smDown>
                                                            <Grid item xs={6}>
                                                                <Typography>
                                                                    <small>
                                                                        1A: {formatters.field['iry_risk_1y'](fund.iry_risk_1y)}<br />
                                                                        2A: {formatters.field['iry_risk_2y'](fund.iry_risk_2y)}<br />
                                                                        3A: {formatters.field['iry_risk_3y'](fund.iry_risk_3y)}<br />
                                                                    </small>
                                                                </Typography>
                                                            </Grid>
                                                        </Hidden>
                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={1}>
                                                    <Typography align="center" >
                                                        <IconButton className={classes.button}
                                                            onClick={() => this.handleAddClick(fund)}>
                                                            <AddIcon />
                                                        </IconButton>
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        ))
                                    }
                                </Paper>
                            )}
                            isNull={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography></Paper>)}
                            isErrored={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                        />
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            <Hidden smDown>
                                <DataHistoryChartComponent
                                    data={this.state.data.chartLarge}
                                    onInitialized={(figure) => this.handleChartInitialized(figure)}
                                    onUpdate={(figure) => this.handleChartUpdate(figure)} />
                            </Hidden>
                            <Hidden mdUp>
                                <DataHistoryChartComponent
                                    data={this.state.data.chartSmall}
                                    onInitialized={(figure) => this.handleChartInitialized(figure)}
                                    onUpdate={(figure) => this.handleChartUpdate(figure)} />
                            </Hidden>
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.optionsBar}>
                            <Grid container spacing={8} key={this.state.config.benchmark} alignItems="center">
                                <Grid item xs>
                                    <Grid container spacing={8}>
                                        <Grid item>
                                            <Typography>&nbsp;</Typography>
                                        </Grid>
                                        <Grid item xs>
                                            <Typography align="center">
                                                <b>Nome do Fundo</b>
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                <ShowStateComponent
                                    data={this.state.data.benchmark.data}
                                    hasData={() => {
                                        let availableSlots = 0;

                                        if (isWidthUp('lg', this.props.width)) availableSlots = 5;
                                        else if (isWidthUp('md', this.props.width)) availableSlots = 4;
                                        else if (isWidthUp('sm', this.props.width)) availableSlots = 1;
                                        else if (isWidthUp('xs', this.props.width)) availableSlots = 0;

                                        let fields = ['investment_return', 'relative_investment_return', 'correlation', 'risk', 'sharpe', 'consistency'];
                                        const selectedFields = [];

                                        fields = fields.filter(field => field !== this.state.config.field);
                                        selectedFields.push(this.state.config.field)

                                        Array(availableSlots).fill(null).forEach(slot => {
                                            selectedFields.push(fields.shift());
                                        })

                                        return (
                                            <Grid item xs={4} sm={6} md={7} lg={9}>
                                                <Grid container spacing={8} alignItems="center" justify="center">
                                                    {
                                                        selectedFields.map(field => (
                                                            <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                <Typography align="center"><b>{fieldOptions.find(fieldItem => fieldItem.name === field).displayName}</b></Typography>
                                                            </Grid>))
                                                    }
                                                </Grid>
                                            </Grid>
                                        );
                                    }}
                                    isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                                    isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                                />
                                <Grid item xs={1}>
                                    <Typography>&nbsp;</Typography>
                                </Grid>
                            </Grid>
                            <ShowStateComponent
                                data={this.state.data.benchmark}
                                hasData={() => (
                                    <Grid container spacing={16} key={this.state.config.benchmark} alignItems="center">
                                        <Grid item xs>
                                            <Grid container spacing={8}>
                                                <Grid item>
                                                    <span style={{ backgroundColor: nextColorIndex(0), minWidth: '10px', height: '100%', display: 'block' }}></span>
                                                </Grid>
                                                <Grid item xs>
                                                    <Typography className={classes.benchmarkCell}><b>{this.state.data.benchmark.name}</b></Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <ShowStateComponent
                                            data={this.state.data.benchmark.data}
                                            hasData={() => {
                                                let availableSlots = 0;

                                                if (isWidthUp('lg', this.props.width)) availableSlots = 5;
                                                else if (isWidthUp('md', this.props.width)) availableSlots = 4;
                                                else if (isWidthUp('sm', this.props.width)) availableSlots = 1;
                                                else if (isWidthUp('xs', this.props.width)) availableSlots = 0;

                                                let fields = ['investment_return', 'relative_investment_return', 'correlation', 'risk', 'sharpe', 'consistency'];
                                                const selectedFields = [];

                                                fields = fields.filter(field => field !== this.state.config.field);
                                                selectedFields.push(this.state.config.field)

                                                Array(availableSlots).fill(null).forEach(slot => {
                                                    selectedFields.push(fields.shift());
                                                })

                                                return (
                                                    <Grid item xs={4} sm={6} md={7} lg={9}>
                                                        <Grid container spacing={8} alignItems="center" justify="center">
                                                            {
                                                                selectedFields.map(field => (
                                                                    <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                        {this.state.data.benchmark.data.accumulated[field] ? (<Typography align="center">{formatters.field[field](this.state.data.benchmark.data.accumulated[field])}</Typography>) : (<Typography align="center">-</Typography>)}
                                                                    </Grid>))
                                                            }
                                                        </Grid>
                                                    </Grid>
                                                );
                                            }}
                                            isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                                            isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                                        />
                                        <Grid item xs={1}>
                                            <Typography>&nbsp;</Typography>
                                        </Grid>
                                    </Grid>
                                )}
                                isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                                isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                            />
                            <ShowStateComponent
                                data={this.state.data.fundListCompare}
                                hasData={() => (
                                    <React.Fragment>
                                        {
                                            this.state.data.fundListCompare.map((fundObject, index) => (
                                                <Grid container spacing={8} key={index} alignItems="center" justify="center">
                                                    <ShowStateComponent
                                                        data={fundObject.detail}
                                                        hasData={() => (
                                                            <Grid item xs>
                                                                <Grid container spacing={8}>
                                                                    <Grid item>
                                                                        <span style={{ backgroundColor: nextColorIndex(index + 1), minWidth: '10px', height: '100%', display: 'block' }}></span>
                                                                    </Grid>
                                                                    <Grid item xs>
                                                                        <Typography>
                                                                            <b><Link to={'/funds/' + fundObject.cnpj} className={classes.link}>{fundObject.detail.name}</Link></b><br />
                                                                            <small>
                                                                                <b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](fundObject.detail.benchmark)}
                                                                            </small>
                                                                        </Typography>
                                                                    </Grid>
                                                                </Grid>
                                                            </Grid>
                                                        )}
                                                        isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                                                        isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                                                    />
                                                    <ShowStateComponent
                                                        data={fundObject.data}
                                                        hasData={() => {
                                                            let availableSlots = 0;

                                                            if (isWidthUp('lg', this.props.width)) availableSlots = 5;
                                                            else if (isWidthUp('md', this.props.width)) availableSlots = 4;
                                                            else if (isWidthUp('sm', this.props.width)) availableSlots = 1;
                                                            else if (isWidthUp('xs', this.props.width)) availableSlots = 0;

                                                            let fields = ['investment_return', 'relative_investment_return', 'correlation', 'risk', 'sharpe', 'consistency'];
                                                            const selectedFields = [];

                                                            fields = fields.filter(field => field !== this.state.config.field);
                                                            selectedFields.push(this.state.config.field)

                                                            Array(availableSlots).fill(null).forEach(slot => {
                                                                selectedFields.push(fields.shift());
                                                            })

                                                            return (
                                                                <Grid item xs={4} sm={6} md={7} lg={9}>
                                                                    <Grid container spacing={8} key={index} alignItems="center" justify="center">
                                                                        {
                                                                            selectedFields.map(field => (
                                                                                <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                                    {fundObject.data.accumulated[field] ? (<Typography align="center">{formatters.field[field](fundObject.data.accumulated[field])}</Typography>) : (<Typography>&nbsp;</Typography>)}
                                                                                </Grid>))
                                                                        }
                                                                    </Grid>
                                                                </Grid>
                                                            );
                                                        }}
                                                        isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography>)}
                                                    />
                                                    <Grid item xs={1}>
                                                        <Typography align="center">
                                                            <IconButton className={classes.button}
                                                                onClick={() => this.handleRemoveClick(fundObject)}>
                                                                <ClearIcon color="error" />
                                                            </IconButton>
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            ))
                                        }
                                    </React.Fragment>
                                )}
                                isNull={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography></Paper>)}
                                isErrored={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </div >
        );
    }
}

export default withWidth()(withStyles(styles)(withRouter(FundComparisonView)));