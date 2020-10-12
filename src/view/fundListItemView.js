import React, { useCallback } from 'react';
import { StringParam, useQueryParam, withDefault } from 'use-query-params';
import createPersistedState from 'use-persisted-state';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import { makeStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import Link from '@material-ui/core/Link';
import Skeleton from '@material-ui/lab/Skeleton';
import { produce } from 'immer';
import { useParams } from 'react-router-dom';
//import useTitle from "@hookeasy/use-title";
import slugify from 'slugify';
import API from '../api';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import { fieldOptions, benchmarkOptions, rangeOptions } from './option';
import { nextColorIndex, formatters, chartFormatters, settle, reportErrorIfNecessary, useState, useEffect, useRendering } from '../util';

const usePersistedConfigState = createPersistedState('fundListItemView.config');

const useStyles = makeStyles(theme => ({
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
}));

const emptyState = {
    data: {
        fund: null,
        history: null,
        chart: {
            chartSmall: null,
            chartLarge: null
        },
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

function buildChart(benchmark, name, statistics, size = 'small') {
    let colorIndex = 0;

    const benchmarkText = benchmarkOptions.find(benchmarkOption => benchmarkOption.name === benchmark).displayName;
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

function FundListItemView(props) {

    // Data
    const [fund, setFund] = useState(emptyState.data.fund);
    const [fundHistory, setFundHistory] = useState(emptyState.data.history);
    const [chart, setChart] = useState(emptyState.data.chart);

    // Config from URL
    const { cnpj } = useParams();
    const [benchmark, setBenchmark] = useQueryParam('b', withDefault(StringParam, emptyState.config.benchmark));
    const [range, setRange] = useQueryParam('r', withDefault(StringParam, emptyState.config.range));
    const [field, setField] = useQueryParam('f', withDefault(StringParam, emptyState.config.field));

    // const [persistedConfig, setPersistedConfig] = usePersistedConfigState({
    //     benchmark: emptyState.config.benchmark,
    //     range: emptyState.config.range,
    //     field: emptyState.config.field,
    // });

    const styles = useStyles();
    useRendering();

    // if (typeof (benchmark) == 'undefined' || typeof (range) == 'undefined' || typeof (field) == 'undefined') {
    //     if (typeof (benchmark) == 'undefined') benchmark = persistedConfig.benchmark;
    //     if (typeof (range) == 'undefined') range = persistedConfig.range;
    //     if (typeof (field) == 'undefined') field = persistedConfig.field;
    //     history.replace(pathTemplate(benchmark, range, field));
    // }    

    // useEffect(() => {
    //     setPersistedConfig({
    //         benchmark,
    //         field,
    //         range: range
    //     });
    // }, [setPersistedConfig, benchmark, range, field]);

    // Updaters
    const updateFund = useCallback(async function updateFund(cnpj, setFund) {
        const fund = await settle(fetchFundData(cnpj));

        if (fund instanceof Error) setFund(fund);
        else setFund(fund[0]);

        reportErrorIfNecessary(fund);
    }, []);

    const updateHistoryAndChart = useCallback(async function updateHistoryAndChart(cnpj, fund, range, benchmark) {
        if (fund != null) {
            const fundHistory = await settle(fetchFundStatistic(cnpj, range, benchmark));

            setFundHistory(fundHistory);

            if (fundHistory instanceof Error) {
                setChart({
                    small: fundHistory,
                    large: fundHistory
                });
            } else {
                setChart({
                    small: buildChart(benchmark, fund.f_short_name, fundHistory, 'small'),
                    large: buildChart(benchmark, fund.f_short_name, fundHistory, 'large')
                });
            }

            reportErrorIfNecessary(fundHistory);
        }
    }, []);

    // Effects
    useEffect(() => {
        setFund(emptyState.data.fund);
        updateFund(cnpj, setFund);
    }, [updateFund, cnpj]);

    useEffect(() => {
        setFundHistory(emptyState.data.history);
        setChart(emptyState.data.chart);
        updateHistoryAndChart(cnpj, fund, range, benchmark);
    }, [updateHistoryAndChart, cnpj, fund, range, benchmark]);

    // Fetchers
    function fetchFundData(cnpj) {
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

    function fetchFundStatistic(cnpj, range, benchmark) {
        const from = rangeOptions.find(rangeOption => rangeOption.name === range).toDate();

        return API.getFundStatistic(cnpj, benchmark, from);
    }

    // Handlers
    function handleConfigRangeChange(event) {
        setRange(event.target.value);
    }

    function handleConfigBenchmarkChange(event) {
        setBenchmark(event.target.value);
    }

    function handleConfigFieldChange(event) {
        setField(event.target.value);
    }

    function handleChartInitialized(figure) {
        setChart(produce(draft => {
            if (figure.layout.size === 'small') draft.small = figure;
            else if (figure.layout.size === 'large') draft.large = figure;
        }));
    }

    function handleChartUpdate(figure) {
        setChart(produce(draft => {
            if (figure.layout.size === 'small') draft.small = figure;
            else if (figure.layout.size === 'large') draft.large = figure;
        }));
    }

    return (
        <div>
            <div className={styles.appBarSpacer} />
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
                                <Typography variant="h5" className={styles.withTooltip}>{fund && formatters.field['f_short_name'](fund.f_short_name)}</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Select
                                value={benchmark}
                                onChange={handleConfigBenchmarkChange}
                                className={styles.select}
                                inputProps={{
                                    name: 'benchmark',
                                    id: 'benchmark',
                                }}>
                                {benchmarkOptions.map(benchmark => (<MenuItem key={benchmark.name} value={benchmark.name}>{benchmark.displayName}</MenuItem>))}
                            </Select>
                        </Grid>
                        <Grid item>
                            <Select
                                value={range}
                                onChange={handleConfigRangeChange}
                                className={styles.select}
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
                    <Paper elevation={1} square={true} className={styles.chart} >
                        <ShowStateComponent
                            data={fund}
                            hasData={() => (
                                <React.Fragment>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="subtitle1" gutterBottom><b>CVM</b></Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container spacing={2}>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>CNPJ:</b> {formatters.field['f_cnpj'](fund.f_cnpj)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Classe:</b> {formatters.field['icf_classe'](fund.icf_classe)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Situação:</b> {formatters.field['icf_sit'](fund.icf_sit)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Fundo de condomínio:</b> {formatters.field['icf_condom'](fund.icf_condom)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Fundo de cotas:</b> {formatters.field['icf_fundo_cotas'](fund.icf_fundo_cotas)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Fundo exclusivo:</b> {formatters.field['icf_fundo_exclusivo'](fund.icf_fundo_exclusivo)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](fund.icf_rentab_fundo)}</Typography></Grid>
                                        <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Patrimônio:</b> {formatters.field['icf_vl_patrim_liq'](fund.icf_vl_patrim_liq)}</Typography></Grid>
                                    </Grid>
                                    {
                                        fund.xf_id && (
                                            <React.Fragment>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12}>
                                                        <Divider variant="middle" />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle1" gutterBottom><b>XP Investimentos</b></Typography>
                                                    </Grid>
                                                </Grid>
                                                <Grid container spacing={2}>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Nome:</b> {formatters.field['xf_name'](fund.xf_name)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Risco Formal:</b> {formatters.field['xf_formal_risk'](fund.xf_formal_risk)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Investimento Inicial:</b> {formatters.field['xf_initial_investment'](fund.xf_initial_investment)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Dias para Resgate:</b> {formatters.field['xf_rescue_quota'](fund.xf_rescue_quota)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Benchmark:</b> {formatters.field['xf_benchmark'](fund.xf_benchmark)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Categoria:</b> {formatters.field['xf_type'](fund.xf_type)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Capitação:</b> {formatters.field['xf_state'](fund.xf_state)}</Typography></Grid>
                                                </Grid>
                                            </React.Fragment>
                                        )
                                    }
                                    {
                                        fund.bf_id && (
                                            <React.Fragment>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12}>
                                                        <Divider variant="middle" />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle1" gutterBottom><b><Link className={styles.link} href={`https://www.btgpactualdigital.com/fundos-de-investimento/${slugify(fund.bf_product.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(), "-")}`} target="_new" rel="noopener">BTG Pactual</Link></b></Typography>
                                                    </Grid>
                                                </Grid>
                                                <Grid container spacing={2}>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Nome:</b> {formatters.field['bf_product'](fund.bf_product)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Risco Formal:</b> {formatters.field['bf_risk_level'](fund.bf_risk_level)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Investimento Inicial:</b> {formatters.field['bf_minimum_initial_investment'](fund.bf_minimum_initial_investment)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Dias para Resgate:</b> {formatters.field['bf_rescue_quota'](fund.bf_rescue_quota)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Categoria:</b> {formatters.field['bf_category_description'](fund.bf_category_description)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Classe Anbima:</b> {formatters.field['bf_anbima_rating'](fund.bf_anbima_rating)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Capitação:</b> {formatters.field['bf_is_blacklist'](fund.bf_is_blacklist)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Atividade:</b> {formatters.field['bf_inactive'](fund.bf_inactive)}</Typography></Grid>
                                                </Grid>
                                            </React.Fragment>
                                        )
                                    }
                                    {
                                        fund.mf_id && (
                                            <React.Fragment>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12}>
                                                        <Divider variant="middle" />
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle1" gutterBottom><b><Link className={styles.link} href={`https://www.modalmais.com.br${fund.mf_detail_link}`} target="_new" rel="noopener">Modal Mais</Link></b></Typography>
                                                    </Grid>
                                                </Grid>
                                                <Grid container spacing={2}>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Nome:</b> {formatters.field['mf_name'](fund.bf_product)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Risco Formal:</b> {formatters.field['mf_risk_level'](fund.mf_risk_level)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Investimento Inicial:</b> {formatters.field['mf_minimum_initial_investment'](fund.mf_minimum_initial_investment)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Dias para Resgate:</b> {formatters.field['mf_rescue_quota'](fund.mf_rescue_quota)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Benchmark:</b> {formatters.field['mf_benchmark'](fund.mf_benchmark)}</Typography></Grid>
                                                    <Grid item xl={3} lg={3} md={4} sm={6} xs={12}><Typography variant="body2"><b>Atividade:</b> {formatters.field['mf_active'](fund.mf_active)}</Typography></Grid>
                                                </Grid>
                                            </React.Fragment>
                                        )
                                    }
                                </React.Fragment>
                            )}
                            isNull={() => (<Typography variant="subtitle1" align="center"><Skeleton /></Typography>)}
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
                                <Typography variant="h6" className={styles.withTooltip}>Gráfico Histórico</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs>
                    <Paper elevation={1} square={true} className={styles.chart} >
                        <Hidden smDown>
                            <DataHistoryChartComponent
                                data={chart.large}
                                onInitialized={figure => handleChartInitialized(figure)}
                                onUpdate={figure => handleChartUpdate(figure)} />
                        </Hidden>
                        <Hidden mdUp>
                            <DataHistoryChartComponent
                                data={chart.small}
                                onInitialized={figure => handleChartInitialized(figure)}
                                onUpdate={figure => handleChartUpdate(figure)} />
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
                                <Typography variant="h6" className={styles.withTooltip}>Tabela Histórica</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Select
                                value={field}
                                onChange={handleConfigFieldChange}
                                className={styles.select}
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
                    <Paper elevation={1} square={true} className={styles.chart}>
                        <ShowStateComponent
                            data={fundHistory}
                            hasData={() => (
                                <React.Fragment>
                                    <table className={styles.historyTable}>
                                        <thead>
                                            <tr className={styles.historyCell}>
                                                <th className={styles.historyCell}>Ano</th>
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
                                                Object.keys(fundHistory.byYear).map(year => (
                                                    <tr className={styles.historyCell} key={year}>
                                                        <th className={styles.historyCell}>{year}</th>
                                                        <Hidden mdDown>
                                                            {
                                                                ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(month => (
                                                                    <td key={year + month}><Typography variant="body2">{fundHistory.byMonth[year + month] != null ? formatters.field[field](fundHistory.byMonth[year + month][field]) : ''}</Typography></td>
                                                                ))
                                                            }
                                                        </Hidden>
                                                        <td><Typography variant="body2">{fundHistory.byYear[year] != null ? formatters.field[field](fundHistory.byYear[year][field]) : ''}</Typography></td>
                                                        <td><Typography variant="body2">{fundHistory.accumulatedByYear[year] != null ? formatters.field[field](fundHistory.accumulatedByYear[year][field]) : ''}</Typography></td>
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </React.Fragment>)}
                            isNull={() => (<Typography variant="subtitle1" align="center"><Skeleton /></Typography>)}
                            isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)} />
                    </Paper>
                </Grid>
            </Grid>
        </div >
    );
}

export default FundListItemView;