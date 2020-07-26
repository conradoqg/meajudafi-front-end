import React from 'react';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import Hidden from '@material-ui/core/Hidden';
import CircularProgress from '@material-ui/core/CircularProgress';
import Link from '@material-ui/core/Link';
import { produce } from 'immer';
import promisesEach from 'promise-results';
import { withRouter } from 'react-router-dom';
import slugify from 'slugify';
import API from '../api';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import { fieldOptions, benchmarkOptions, rangeOptions } from './option';
import { nextColorIndex, formatters, chartFormatters } from '../util';
import * as Sentry from '@sentry/browser';

const styles = theme => ({
    select: {
        margin: theme.spacing(1)
    },
    chart: {
        padding: theme.spacing(2)
    },
    withTooltip: theme.withTooltip,
    link: theme.link,
    appBarSpacer: theme.mixins.toolbar,
    historyTable: {
        width: '100%',
        textAlign: 'center',
        padding: '5px'
    },
    historyCell: {
        padding: '5px'
    }
});

const emptyState = {
    data: {
        fund: null,
        history: null,
        chartSmall: null,
        chartLarge: null
    },
    config: {
        cnpj: null,
        benchmark: 'cdi',
        range: '1y',
        field: 'investment_return'
    }
};

class FundListItemView extends React.Component {
    state = emptyState;

    constructor(props) {
        super(props);

        this.state.config.cnpj = props.match.params.cnpj;

        this.replaceHistory(this.state);
    }

    componentDidMount() {
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

    buildHistoryPath = nextState => this.props.basePath + '/' + nextState.config.cnpj;

    replaceHistory = nextState => this.props.history.replace(this.buildHistoryPath(nextState), nextState);

    pushHistory = nextState => this.props.history.push(this.buildHistoryPath(nextState), nextState);

    handleConfigRangeChange = event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.history = null;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        return this.updateData(nextState);
    }

    handleConfigBenchmarkChange = event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.history = null;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        return this.updateData(nextState);
    }

    handleConfigFieldChange = event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        return this.updateData(nextState);
    }

    handleChartInitialized = figure => {
        this.setState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.chartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.chartLarge = figure;
        }));
    }

    handleChartUpdate = figure => {
        this.setState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.chartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.chartLarge = figure;
        }));
    }

    updateData = async nextState => {
        this.setState(produce(nextState, draft => {
            draft.data.fund = null;
            draft.data.history = null;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        }));

        let { fundData, fundHistory } = await promisesEach({
            fundData: this.getFundData(nextState.config.cnpj),
            fundHistory: this.getFundStatistic(nextState.config.cnpj, nextState.config)
        });

        nextState = produce(nextState, draft => {
            if (fundData instanceof Error) {
                Sentry.captureException(fundData);
                draft.data.fund = fundData.message;
            } else draft.data.fund = fundData[0];

            if (fundHistory instanceof Error) {
                Sentry.captureException(fundHistory);
                draft.data.history = fundHistory.message;
            } else draft.data.history = fundHistory;

            if (fundHistory instanceof Error) {
                draft.data.chartSmall = fundHistory.message;
                draft.data.chartLarge = fundHistory.message;
            } else {
                draft.data.chartSmall = this.buildChart(draft.config, fundData[0].f_short_name, draft.data.history, 'small');
                draft.data.chartLarge = this.buildChart(draft.config, fundData[0].f_short_name, draft.data.history, 'large');
            }

        });
        this.setState(nextState);
    }

    buildChart = (config, name, statistics, size = 'small') => {
        let colorIndex = 0;

        const benchmarkText = benchmarkOptions.find(benchmark => benchmark.name === config.benchmark).displayName;
        const min_y = Math.min(statistics.daily.min_investment_return, statistics.daily.min_benchmark_investment_return);
        const max_y = Math.max(statistics.daily.max_investment_return, statistics.daily.max_benchmark_investment_return);

        let domain = null;
        if (size === 'large') domain = [0.08, 0.75];
        else domain = [0, 1];

        let margin = null;
        if (size === 'large') margin = { l: 0, r: 0, t: 50, b: 0 };
        else margin = { l: 15, r: 15, t: 80, b: 10 };

        return {
            data: [
                {
                    x: statistics.daily.date,
                    y: statistics.daily.investment_return,
                    type: 'scatter',
                    name: 'Desempenho',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.daily.date,
                    y: statistics.daily.benchmark_investment_return,
                    type: 'scatter',
                    name: `Benchmark (${benchmarkText})`,
                    yaxis: 'y2',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.daily.date,
                    y: statistics.daily.risk,
                    type: 'scatter',
                    name: 'Risco',
                    yaxis: 'y3',
                    line: { color: nextColorIndex(colorIndex++) },
                    visible: 'legendonly'
                },
                {
                    x: statistics.daily.date,
                    y: statistics.daily.sharpe,
                    type: 'scatter',
                    name: 'Sharpe',
                    yaxis: 'y4',
                    line: { color: nextColorIndex(colorIndex++) },
                    visible: 'legendonly'
                },
                {
                    x: statistics.daily.date,
                    y: statistics.daily.consistency,
                    type: 'scatter',
                    name: 'Consistência',
                    yaxis: 'y5',
                    line: { color: nextColorIndex(colorIndex++) },
                    visible: 'legendonly'
                },
                {
                    x: statistics.daily.date,
                    y: statistics.daily.networth,
                    type: 'scatter',
                    name: 'Patrimônio',
                    yaxis: 'y6',
                    line: { color: nextColorIndex(colorIndex++) },
                    visible: 'legendonly'
                },
                {
                    x: statistics.daily.date,
                    y: statistics.daily.quotaholders,
                    type: 'scatter',
                    name: 'Cotistas',
                    yaxis: 'y7',
                    line: { color: nextColorIndex(colorIndex++) },
                    visible: 'legendonly'
                }
            ],
            layout: {
                title: name,
                separators: ',.',
                autosize: true,
                showlegend: true,
                legend: { 'orientation': 'h' },
                font: {
                    family: '"Roboto", "Helvetica", "Arial", sans-serif'
                },
                size,
                margin,
                dragmode: size === 'small' ? false : 'zoom',
                xaxis: {
                    showspikes: true,
                    spikemode: 'across',
                    domain,
                    fixedrange: size === 'small' ? true : false
                },
                yaxis: {
                    title: 'Desempenho',
                    tickformat: chartFormatters.investment_return.tickformat,
                    hoverformat: chartFormatters.investment_return.hoverformat,
                    fixedrange: true,
                    range: [min_y, max_y],
                    visible: size === 'small' ? false : true
                },
                yaxis2: {
                    title: `Benchmark (${benchmarkText})`,
                    tickformat: chartFormatters.investment_return.tickformat,
                    hoverformat: chartFormatters.investment_return.hoverformat,
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'left',
                    range: [min_y, max_y],
                    fixedrange: true,
                    position: 0,
                    visible: size === 'small' ? false : true
                },
                yaxis3: {
                    title: 'Risco',
                    tickformat: chartFormatters.risk.tickformat,
                    hoverformat: chartFormatters.risk.hoverformat,
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    visible: size === 'small' ? false : true
                },
                yaxis4: {
                    title: 'Sharpe',
                    tickformat: chartFormatters.sharpe.tickformat,
                    hoverformat: chartFormatters.sharpe.hoverformat,
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.78,
                    visible: size === 'small' ? false : true
                },
                yaxis5: {
                    title: 'Consistência',
                    tickformat: chartFormatters.consistency.tickformat,
                    hoverformat: chartFormatters.consistency.hoverformat,
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.84,
                    visible: size === 'small' ? false : true
                },
                yaxis6: {
                    title: 'Patrimônio',
                    type: 'linear',
                    tickprefix: chartFormatters.networth.tickprefix,
                    tickformat: chartFormatters.networth.tickformat,
                    hoverformat: chartFormatters.networth.hoverformat,
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.89,
                    visible: size === 'small' ? false : true
                },
                yaxis7: {
                    title: 'Cotistas',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.95,
                    visible: size === 'small' ? false : true
                }
            },
            frames: [],
            config: {
                locale: 'pt-BR',
                displayModeBar: true
            }
        };
    }

    getFundData = cnpj => {
        const additionalFields = [
            'f_cnpj',
            'icf_dt_ini_exerc',
            'icf_dt_fim_exerc',
            'icf_classe',
            'icf_sit',
            'icf_condom',
            'icf_fundo_cotas',
            'icf_fundo_exclusivo',
            'icf_rentab_fundo',
            'icf_vl_patrim_liq',
            'xf_name',
            'xf_id',
            'xf_formal_risk',
            'xf_initial_investment',
            'xf_rescue_quota',
            'xf_benchmark',
            'xf_type',
            'xf_state',
            'bf_id',
            'bf_product',
            'bf_risk_level',
            'bf_minimum_initial_investment',
            'bf_rescue_quota',
            'bf_category_description',
            'bf_anbima_rating',
            'bf_is_blacklist',
            'bf_inactive',
            'mf_id',
            'mf_name',
            'mf_risk_level',
            'mf_minimum_initial_investment',
            'mf_rescue_quota',
            'mf_benchmark',
            'mf_active',
            'mf_detail_link'];

        return API.getFundData(cnpj, additionalFields);
    }

    getFundStatistic = (cnpj, config) => {
        const from = rangeOptions.find(range => range.name === config.range).toDate();

        return API.getFundStatistic(cnpj, config.benchmark, from);
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={1}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Detalhes do fundo.</p>
                                        <p>No lado direito é possível alterar o benchmark e intervalo visualizado.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h5" className={classes.withTooltip}>{this.state.data.fund && formatters.field['f_short_name'](this.state.data.fund.f_short_name)}</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container alignItems="center" spacing={1}>
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
                    </Grid>
                </Grid>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                        <Typography variant="h6">Informações Gerais</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            <ShowStateComponent
                                data={this.state.data.fund}
                                hasData={() => (
                                    <React.Fragment>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle1" gutterBottom><b>CVM</b></Typography>
                                            </Grid>
                                        </Grid>
                                        <Grid container spacing={2}>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>CNPJ:</b> {formatters.field['f_cnpj'](this.state.data.fund.f_cnpj)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Classe:</b> {formatters.field['icf_classe'](this.state.data.fund.icf_classe)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Situação:</b> {formatters.field['icf_sit'](this.state.data.fund.icf_sit)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Fundo de condomínio:</b> {formatters.field['icf_condom'](this.state.data.fund.icf_condom)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Fundo de cotas:</b> {formatters.field['icf_fundo_cotas'](this.state.data.fund.icf_fundo_cotas)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Fundo exclusivo:</b> {formatters.field['icf_fundo_exclusivo'](this.state.data.fund.icf_fundo_exclusivo)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](this.state.data.fund.icf_rentab_fundo)}</Typography></Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Patrimônio:</b> {formatters.field['icf_vl_patrim_liq'](this.state.data.fund.icf_vl_patrim_liq)}</Typography></Grid>
                                        </Grid>
                                        {
                                            this.state.data.fund.xf_id && (
                                                <React.Fragment>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12}>
                                                            <Divider variant="middle" />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle1" gutterBottom><b><Link className={classes.link} href={`https://institucional.xpi.com.br/investimentos/fundos-de-investimento/detalhes-de-fundos-de-investimento.aspx?F=${this.state.data.fund.xf_id}`} target="_new" rel="noopener">XP Investimentos</Link></b></Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={2}>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Nome:</b> {formatters.field['xf_name'](this.state.data.fund.xf_name)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Risco Formal:</b> {formatters.field['xf_formal_risk'](this.state.data.fund.xf_formal_risk)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Investimento Inicial:</b> {formatters.field['xf_initial_investment'](this.state.data.fund.xf_initial_investment)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Dias para Resgate:</b> {formatters.field['xf_rescue_quota'](this.state.data.fund.xf_rescue_quota)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Benchmark:</b> {formatters.field['xf_benchmark'](this.state.data.fund.xf_benchmark)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Categoria:</b> {formatters.field['xf_type'](this.state.data.fund.xf_type)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Capitação:</b> {formatters.field['xf_state'](this.state.data.fund.xf_state)}</Typography></Grid>
                                                    </Grid>
                                                </React.Fragment>
                                            )
                                        }
                                        {
                                            this.state.data.fund.bf_id && (
                                                <React.Fragment>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12}>
                                                            <Divider variant="middle" />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle1" gutterBottom><b><Link className={classes.link} href={`https://www.btgpactualdigital.com/investimentos/fundos-de-investimento/detalhe/${this.state.data.fund.bf_id}/${slugify(this.state.data.fund.bf_product.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), "_")}`} target="_new" rel="noopener">BTG Pactual</Link></b></Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={2}>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Nome:</b> {formatters.field['bf_product'](this.state.data.fund.bf_product)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Risco Formal:</b> {formatters.field['bf_risk_level'](this.state.data.fund.bf_risk_level)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Investimento Inicial:</b> {formatters.field['bf_minimum_initial_investment'](this.state.data.fund.bf_minimum_initial_investment)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Dias para Resgate:</b> {formatters.field['bf_rescue_quota'](this.state.data.fund.bf_rescue_quota)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Categoria:</b> {formatters.field['bf_category_description'](this.state.data.fund.bf_category_description)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Classe Anbima:</b> {formatters.field['bf_anbima_rating'](this.state.data.fund.bf_anbima_rating)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Capitação:</b> {formatters.field['bf_is_blacklist'](this.state.data.fund.bf_is_blacklist)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Atividade:</b> {formatters.field['bf_inactive'](this.state.data.fund.bf_inactive)}</Typography></Grid>
                                                    </Grid>
                                                </React.Fragment>
                                            )
                                        }
                                        {
                                            this.state.data.fund.mf_id && (
                                                <React.Fragment>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12}>
                                                            <Divider variant="middle" />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Typography variant="subtitle1" gutterBottom><b><Link className={classes.link} href={`https://www.modalmais.com.br${this.state.data.fund.mf_detail_link}`} target="_new" rel="noopener">Modal Mais</Link></b></Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={2}>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Nome:</b> {formatters.field['mf_name'](this.state.data.fund.bf_product)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Risco Formal:</b> {formatters.field['mf_risk_level'](this.state.data.fund.mf_risk_level)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Investimento Inicial:</b> {formatters.field['mf_minimum_initial_investment'](this.state.data.fund.mf_minimum_initial_investment)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Dias para Resgate:</b> {formatters.field['mf_rescue_quota'](this.state.data.fund.mf_rescue_quota)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Benchmark:</b> {formatters.field['mf_benchmark'](this.state.data.fund.mf_benchmark)}</Typography></Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Atividade:</b> {formatters.field['mf_active'](this.state.data.fund.mf_active)}</Typography></Grid>
                                                    </Grid>
                                                </React.Fragment>
                                            )
                                        }
                                    </React.Fragment>
                                )}
                                isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress /></Typography>)}
                                isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)} />
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={1}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Gráfico histórico para visualização das características do fundo no tempo.</p>
                                        <p>É possível visualizar as outras séries clicando nelas.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h6" className={classes.withTooltip}>Gráfico Histórico</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            <Hidden smDown>
                                <DataHistoryChartComponent
                                    data={this.state.data.chartLarge}
                                    onInitialized={figure => this.handleChartInitialized(figure)}
                                    onUpdate={figure => this.handleChartUpdate(figure)} />
                            </Hidden>
                            <Hidden mdUp>
                                <DataHistoryChartComponent
                                    data={this.state.data.chartSmall}
                                    onInitialized={figure => this.handleChartInitialized(figure)}
                                    onUpdate={figure => this.handleChartUpdate(figure)} />
                            </Hidden>
                        </Paper>
                    </Grid>
                </Grid>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={1}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Histórico mensal, anual e acumulado do fundo.</p>
                                        <p>No lado direito é possível alterar a informação visualizada.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h6" className={classes.withTooltip}>Tabela Histórica</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item>
                        <Grid container alignItems="center" spacing={1}>
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
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart}>
                            <ShowStateComponent
                                data={this.state.data.history}
                                hasData={() => (
                                    <React.Fragment>
                                        <table className={classes.historyTable}>
                                            <thead>
                                                <tr className={classes.historyCell}>
                                                    <th className={classes.historyCell}>Ano</th>
                                                    <Hidden mdDown>
                                                        <th><Typography variant="body2">Jan</Typography></th>
                                                        <th><Typography variant="body2">Fev</Typography></th>
                                                        <th><Typography variant="body2">Mar</Typography></th>
                                                        <th><Typography variant="body2">Abr</Typography></th>
                                                        <th><Typography variant="body2">Mai</Typography></th>
                                                        <th><Typography variant="body2">Jun</Typography></th>
                                                        <th><Typography variant="body2">Jul</Typography></th>
                                                        <th><Typography variant="body2">Ago</Typography></th>
                                                        <th><Typography variant="body2">Set</Typography></th>
                                                        <th><Typography variant="body2">Out</Typography></th>
                                                        <th><Typography variant="body2">Nov</Typography></th>
                                                        <th><Typography variant="body2">Dez</Typography></th>
                                                    </Hidden>
                                                    <th><Typography variant="body2">Ano</Typography></th>
                                                    <th><Typography variant="body2">Accumulado</Typography></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    Object.keys(this.state.data.history.byYear).map(year => (
                                                        <tr className={classes.historyCell} key={year}>
                                                            <th className={classes.historyCell}>{year}</th>
                                                            <Hidden mdDown>
                                                                {
                                                                    ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => (
                                                                        <td key={year + month}><Typography>{this.state.data.history.byMonth[year + month] != null ? formatters.field[this.state.config.field](this.state.data.history.byMonth[year + month][this.state.config.field]) : ''}</Typography></td>
                                                                    ))
                                                                }
                                                            </Hidden>
                                                            <td><Typography variant="body2">{this.state.data.history.byYear[year] != null ? formatters.field[this.state.config.field](this.state.data.history.byYear[year][this.state.config.field]) : ''}</Typography></td>
                                                            <td><Typography variant="body2">{this.state.data.history.accumulatedByYear[year] != null ? formatters.field[this.state.config.field](this.state.data.history.accumulatedByYear[year][this.state.config.field]) : ''}</Typography></td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </React.Fragment>)}
                                isNull={() => (<Typography variant="subtitle1" align="center"><CircularProgress /></Typography>)}
                                isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)} />
                        </Paper>
                    </Grid>
                </Grid>
            </div >
        );
    }
}

export default withWidth()(withStyles(styles)(withRouter(FundListItemView)));