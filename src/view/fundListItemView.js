import React from 'react';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { withStyles } from '@material-ui/core/styles';
import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import Hidden from '@material-ui/core/Hidden';
import { produce, setAutoFreeze } from 'immer';
import promisesEach from 'promise-results';
import { withRouter } from 'react-router-dom';
import API from '../api';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import { fieldOptions, benchmarkOptions, rangeOptions } from './option';
import { nextColorIndex, formatters, chartFormatters } from '../util';

setAutoFreeze(false);

const styles = theme => ({
    select: {
        margin: theme.spacing.unit
    },
    chart: {
        padding: theme.spacing.unit * 2
    }
});

const emptyState = {
    data: {
        fund: null,
        history: null,
        chart: null
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

    buildHistoryPath = (nextState) => {
        return this.props.basePath + '/' + nextState.config.cnpj;
    }

    replaceHistory = (nextState) => {
        this.props.history.replace(this.buildHistoryPath(nextState), nextState);
    }

    pushHistory = (nextState) => {
        this.props.history.push(this.buildHistoryPath(nextState), nextState);
    }

    handleConfigRangeChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.history = null;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        return this.updateData(nextState);
    }

    handleConfigBenchmarkChange = async event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
            draft.data.history = null;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        return this.updateData(nextState);
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

    updateData = async (nextState) => {
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
            if (fundData instanceof Error) draft.data.fund = fundData.message;
            else draft.data.fund = fundData[0];

            if (fundHistory instanceof Error) draft.data.fund = fundData.message;
            else draft.data.history = fundHistory;

            if (fundHistory instanceof Error) draft.data.chart = fundHistory.message;
            else {
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
                    y: statistics.daily.benchmark_consistency,
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
                size,
                margin,
                xaxis: {
                    showspikes: true,
                    spikemode: 'across',
                    domain
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

    getFundData = async (cnpj) => {
        return API.getFundData(cnpj, ['f_cnpj', 'icf_dt_ini_exerc', 'icf_dt_fim_exerc', 'icf_classe', 'icf_sit', 'icf_condom', 'icf_fundo_cotas', 'icf_fundo_exclusivo', 'icf_rentab_fundo', 'icf_vl_patrim_liq', 'xf_name', 'xf_id', 'xf_formal_risk', 'xf_initial_investment', 'xf_rescue_quota', 'xf_benchmark', 'xf_type', 'bf_id', 'bf_product', 'bf_risk_level', 'bf_minimum_initial_investment', 'bf_rescue_quota', 'bf_category_description', 'bf_anbima_rating']);
    }

    getFundStatistic = async (cnpj, config) => {
        const from = rangeOptions.find(range => range.name === config.range).toDate();

        return API.getFundStatistic(cnpj, config.benchmark, from);
    }

    render() {
        const { globalClasses, classes } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <ShowStateComponent
                            data={this.state.data.fund}
                            hasData={() => (
                                <React.Fragment>
                                    <Typography variant={isWidthUp('md', this.props.width) ? 'display1' : 'headline'} gutterBottom>{formatters.field['f_short_name'](this.state.data.fund.f_short_name)}</Typography>
                                    <Typography variant={isWidthUp('md', this.props.width) ? 'display1' : 'headline'} component="span" gutterBottom><Tooltip title={
                                        <React.Fragment>
                                            <p>Detalhes do fundo.</p>
                                            <p>No lado direito é possível alterar o benchmark e intervalo visualizado.</p>
                                        </React.Fragment>
                                    }><Avatar className={globalClasses.help}>?</Avatar></Tooltip></Typography>
                                </React.Fragment>
                            )} />
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
                                {rangeOptions.map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
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
                            <ShowStateComponent
                                data={this.state.data.fund}
                                hasData={() => (
                                    <React.Fragment>
                                        <Grid container spacing={16}>
                                            <Grid item xs={12}>
                                                <Typography variant="subheading" gutterBottom><b>CVM</b></Typography>
                                            </Grid>
                                        </Grid>
                                        <Grid container spacing={16}>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>CNPJ:</b> {formatters.field['f_cnpj'](this.state.data.fund.f_cnpj)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Classe:</b> {formatters.field['icf_classe'](this.state.data.fund.icf_classe)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Situação:</b> {formatters.field['icf_sit'](this.state.data.fund.icf_sit)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Fundo de condomínio:</b> {formatters.field['icf_condom'](this.state.data.fund.icf_condom)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Fundo de cotas:</b> {formatters.field['icf_fundo_cotas'](this.state.data.fund.icf_fundo_cotas)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Fundo exclusivo:</b> {formatters.field['icf_fundo_exclusivo'](this.state.data.fund.icf_fundo_exclusivo)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](this.state.data.fund.icf_rentab_fundo)}</Grid>
                                            <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Patrimônio:</b> {formatters.field['icf_vl_patrim_liq'](this.state.data.fund.icf_vl_patrim_liq)}</Grid>
                                        </Grid>
                                        {
                                            this.state.data.fund.xf_id && (
                                                <React.Fragment>
                                                    <Grid container spacing={16}>
                                                        <Grid item xs={12}>
                                                            <Divider variant="middle" />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Typography variant="subheading" gutterBottom><b>XP Investimentos</b></Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={16}>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Nome:</b> {formatters.field['xf_name'](this.state.data.fund.xf_name)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Risco Formal:</b> {formatters.field['xf_formal_risk'](this.state.data.fund.xf_formal_risk)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Investimento Inicial:</b> {formatters.field['xf_initial_investment'](this.state.data.fund.xf_initial_investment)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Dias para Resgate:</b> {formatters.field['xf_rescue_quota'](this.state.data.fund.xf_rescue_quota)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Benchmark:</b> {formatters.field['xf_benchmark'](this.state.data.fund.xf_benchmark)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Categoria:</b> {formatters.field['xf_type'](this.state.data.fund.xf_type)}</Grid>
                                                    </Grid>
                                                </React.Fragment>
                                            )
                                        }
                                        {
                                            this.state.data.fund.bf_id && (
                                                <React.Fragment>
                                                    <Grid container spacing={16}>
                                                        <Grid item xs={12}>
                                                            <Divider variant="middle" />
                                                        </Grid>
                                                        <Grid item xs={12}>
                                                            <Typography variant="subheading" gutterBottom><b>BTG Pactual</b></Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={16}>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Nome:</b> {formatters.field['bf_product'](this.state.data.fund.bf_product)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Risco Formal:</b> {formatters.field['bf_risk_level'](this.state.data.fund.bf_risk_level)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Investimento Inicial:</b> {formatters.field['bf_minimum_initial_investment'](this.state.data.fund.bf_minimum_initial_investment)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Dias para Resgate:</b> {formatters.field['bf_rescue_quota'](this.state.data.fund.bf_rescue_quota)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Categoria:</b> {formatters.field['bf_category_description'](this.state.data.fund.bf_category_description)}</Grid>
                                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><b>Classe Anbima:</b> {formatters.field['bf_anbima_rating'](this.state.data.fund.bf_anbima_rating)}</Grid>
                                                    </Grid>
                                                </React.Fragment>
                                            )
                                        }
                                    </React.Fragment>
                                )} />
                        </Paper>
                    </Grid>
                </Grid>
                <br />                
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Gráfico Histórico</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Gráfico histórico para visualização das características do fundo no tempo.</p>
                                <p>É possível visualizar as outras séries clicando nelas.</p>
                            </React.Fragment>
                        }><Avatar className={globalClasses.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} className={classes.chart} >
                            <Hidden smDown>
                                <DataHistoryChartComponent
                                    fund={this.state.data.chartLarge}
                                    onInitialized={(figure) => this.handleChartInitialized(figure)}
                                    onUpdate={(figure) => this.handleChartUpdate(figure)} />
                            </Hidden>
                            <Hidden mdUp>
                                <DataHistoryChartComponent
                                    fund={this.state.data.chartSmall}
                                    onInitialized={(figure) => this.handleChartInitialized(figure)}
                                    onUpdate={(figure) => this.handleChartUpdate(figure)} />
                            </Hidden>
                        </Paper>
                    </Grid>
                </Grid>                
                <br />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Tabela Histórica</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Histórico mensal, anual e acumulado do fundo.</p>
                                <p>No lado direito é possível alterar a informação visualizada.</p>
                            </React.Fragment>
                        }><Avatar className={globalClasses.help}>?</Avatar></Tooltip></Typography>
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
                            <ShowStateComponent
                                data={this.state.data.history}
                                hasData={() => (
                                    <React.Fragment>
                                        <table style={{ width: '100%', textAlign: 'center', padding: '5px' }}>
                                            <thead>
                                                <tr style={{ padding: '5px' }}>
                                                    <th style={{ padding: '5px' }}>Ano</th>
                                                    <Hidden mdDown>
                                                        <th>Jan</th>
                                                        <th>Fev</th>
                                                        <th>Mar</th>
                                                        <th>Abr</th>
                                                        <th>Mai</th>
                                                        <th>Jun</th>
                                                        <th>Jul</th>
                                                        <th>Ago</th>
                                                        <th>Set</th>
                                                        <th>Out</th>
                                                        <th>Nov</th>
                                                        <th>Dez</th>
                                                    </Hidden>
                                                    <th>Ano</th>
                                                    <th>Accumulado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    Object.keys(this.state.data.history.byYear).map(year => (
                                                        <tr style={{ padding: '5px' }} key={year}>
                                                            <th style={{ padding: '5px' }}>{year}</th>
                                                            <Hidden mdDown>
                                                                {
                                                                    ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => (
                                                                        <td key={year + month}>{this.state.data.history.byMonth[year + month] != null ? formatters.field[this.state.config.field](this.state.data.history.byMonth[year + month][this.state.config.field]) : ''}</td>
                                                                    ))
                                                                }
                                                            </Hidden>
                                                            <td>{this.state.data.history.byYear[year] != null ? formatters.field[this.state.config.field](this.state.data.history.byYear[year][this.state.config.field]) : ''}</td>
                                                            <td>{this.state.data.history.accumulatedByYear[year] != null ? formatters.field[this.state.config.field](this.state.data.history.accumulatedByYear[year][this.state.config.field]) : ''}</td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </React.Fragment>)} />
                        </Paper>
                    </Grid>
                </Grid>
            </div >
        );
    }
}

export default withWidth()(withStyles(styles)(withRouter(FundListItemView)));