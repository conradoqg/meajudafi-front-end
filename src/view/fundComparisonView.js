import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrayParam, StringParam, NumberParam, useQueryParam, withDefault } from 'use-query-params';
import { useImmer } from "use-immer";
import { makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import Tooltip from '@material-ui/core/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@material-ui/core/IconButton';
import Hidden from '@material-ui/core/Hidden';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import TablePagination from '@material-ui/core/TablePagination';
import Skeleton from '@material-ui/lab/Skeleton';
import { produce } from 'immer';
import promisesEach from 'promise-results';
import API from '../api';
import StatisticsService from '../service/statisticsService';
import FundSearchComponent from './component/fundSearchComponent';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import { fieldOptions, sortOptions, benchmarkOptions, rangeOptions } from './option';
import { formatters, nextColorIndex, chartFormatters, getGradientColor, isError, reportErrorIfNecessary, settle, useEffect, useState, useRendering } from '../util';
import * as Sentry from '@sentry/browser';

const useStyles = makeStyles(theme => ({
    optionsBar: {
        padding: theme.spacing(1)
    },
    progress: {
        margin: theme.spacing(2)
    },
    select: {
        margin: theme.spacing(1)
    },
    chart: {
        padding: theme.spacing(2)
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
        marginTop: '5px',
        marginBottom: '5px'
    },
    tabsRoot: {
        borderBottom: '1px solid #e8e8e8',
        marginBottom: '5px'
    },
    tabsIndicator: {
        backgroundColor: '#1890ff',
    },
    historyTable: {
        width: '100%',
        textAlign: 'center',
        padding: '5px'
    },
    historyCell: {
        padding: '5px'
    },
    textOverflowDynamicContainer: {
        position: 'relative',
        maxWidth: '100%',
        padding: '10px !important',
        display: 'flex',
        verticalAlign: 'text-center !important',
        '&:after': {
            content: '-',
            display: 'inline',
            visibility: 'hidden',
            width: 0
        }
    },
    textOverflowDynamicEllipsis: {
        position: 'absolute',
        whiteSpace: 'nowrap',
        overflowY: 'visible',
        overflowX: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        minWidth: '0',
        width: '100%',
        top: 0,
        left: 0,
        '&:after': {
            content: '-',
            display: 'inline',
            visibility: 'hidden',
            width: 0
        }
    }
}));

const emptyState = {
    new: {
        data: {
            search: {
                fundListSearch: [],
                totalRows: null
            }
        },
        config: {
            search: {
                page: 0,
                rowsPerPage: 5,
                sort: sortOptions[0],
                search: '',
                searchRevision: 0,
            },
            selectedTab: 0,
            benchmark: 'cdi',
            range: '1y',
            field: 'investment_return',
            fundsToCompare: []
        }
    },
    old: {
        data: {
            fundListCompare: [],
            benchmark: {
                name: benchmarkOptions.find(benchmark => benchmark.name === 'cdi').displayName,
                data: null,
                statistics: null
            },
            correlationMatrix: null,
            chartSmall: null,
            chartLarge: null
        }
    }
};

function buildChart(field, benchmark, fundList, size = 'small') {
    let chartData = [];
    let colorIndex = 0;

    let margin = null;
    if (size === 'large') margin = { l: 60, r: 0, t: 50, b: 40 };
    else margin = { l: 15, r: 15, t: 50, b: 10 };

    if (benchmark) {
        chartData.push({
            x: benchmark.statistics.daily.date,
            y: (field === 'relative_investment_return' || field === 'correlation' || field === 'sharpe' || field === 'consistency' ? (new Array(benchmark.statistics.daily.date.length)).fill(field === 'sharpe' ? 0 : 1) : benchmark.statistics.daily[field]),
            type: 'scatter',
            mode: 'lines',
            name: benchmark.name.toUpperCase(),
            line: { color: nextColorIndex(colorIndex++) }
        });
    }

    if (fundList) {
        fundList.forEach(fund => {
            if (!(fund.statistics instanceof Error))
                chartData.push({
                    x: fund.statistics.daily.date,
                    y: fund.statistics.daily[field],
                    type: 'scatter',
                    mode: 'lines',
                    name: fund.detail.name,
                    line: { color: nextColorIndex(colorIndex++) }
                });
        });
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

function FundComparisonView(props) {
    // Data
    const [searchData, setSearchData] = useImmer(emptyState.new.data.search);
    const [oldState, setOldState] = useState(emptyState.old);

    // Config
    const [searchConfig, setSearchConfig] = useImmer(emptyState.new.config.search);

    // Config from URL
    const [selectedTab, setSelectedTab] = useQueryParam('t', withDefault(NumberParam, emptyState.new.config.selectedTab));
    const [benchmark, setBenchmark] = useQueryParam('b', withDefault(StringParam, emptyState.new.config.benchmark));
    const [range, setRange] = useQueryParam('r', withDefault(StringParam, emptyState.new.config.range));
    const [field, setField] = useQueryParam('f', withDefault(StringParam, emptyState.new.config.field));
    const [fundsToCompare, setFundsToCompare] = useQueryParam('fc', withDefault(ArrayParam, emptyState.new.config.fundsToCompare));

    const styles = useStyles();    
    const isLGUp = useMediaQuery(theme => theme.breakpoints.up('lg'));
    const isMDUp = useMediaQuery(theme => theme.breakpoints.up('md'));
    const isSMUp = useMediaQuery(theme => theme.breakpoints.up('sm'));
    const isXSUp = useMediaQuery(theme => theme.breakpoints.up('xs'));
    const isSMDown = useMediaQuery(theme => theme.breakpoints.down('md'));
    useRendering();

    // Updaters
    const updateData = useCallback(async function updateData(nextState, field, benchmark, range) {        
        const statisticsServiceInstance = await StatisticsService.getInstance();
        const benchmarkToUpdate = nextState.data.benchmark && nextState.data.benchmark.data == null ? nextState.data.benchmark : null;
        const fundsToUpdate = nextState.data.fundListCompare.filter(fund => fund.data == null);

        setOldState(produce(nextState, draft => {
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
            draft.data.correlationMatrix = null;
        }));

        // Retrieve funds and benchmark data
        let dataPromises = {};
        fundsToUpdate.forEach(fund => {
            dataPromises[fund.cnpj] = promisesEach({
                detail: fetchFundData(fund.cnpj),
                data: fetchFundHistory(fund.cnpj, benchmark, range)
            });
        });
        dataPromises.benchmark = benchmarkToUpdate ? fetchBenchmarkHistory(benchmark, range) : null;

        const dataResults = await promisesEach(dataPromises);

        // If the selected range is "best", find the max first date available so the statistics will be calculated starting from that date
        let startingFrom = '0001-01-01';
        if (range === 'best') {
            const minDatesDataResults = Object.values(dataResults).filter(result => result != null && !(result.data instanceof Error)).map(value => value.data ? value.data[value.data.length - 1].ird_dt_comptc : null);
            const minDatesFundListCompare = nextState.data.fundListCompare.map(value => value.data ? value.data[value.data.length - 1].ird_dt_comptc : null);

            startingFrom = minDatesDataResults.concat(minDatesFundListCompare).filter(date => date != null).reduce((acc, curr) => acc > curr ? acc : curr, '0001-01-01');
        }

        // Calculate funds and benchmark statistics
        let statisticsPromises = {};
        fundsToUpdate.forEach(fund => {
            if (dataResults[fund.cnpj].data instanceof Error) {
                Sentry.captureException(dataResults[fund.cnpj].data);
                statisticsPromises[fund.cnpj] = dataResults[fund.cnpj].data;
            } else statisticsPromises[fund.cnpj] = statisticsServiceInstance.calculateFundStatistics(dataResults[fund.cnpj].data, benchmark, startingFrom);
        });
        statisticsPromises.benchmark = benchmarkToUpdate ? statisticsServiceInstance.calculateBenchmarkStatistics(dataResults.benchmark, benchmark, startingFrom) : null;

        const statisticsResults = await promisesEach(statisticsPromises);

        nextState = produce(nextState, draft => {
            // If there's a dataResult for the benchmark, the benchmark's data was updated
            if (dataResults.benchmark) {
                draft.data.benchmark.name = benchmarkOptions.find(benchmarkItem => benchmarkItem.name === benchmark).displayName;
                draft.data.benchmark.data = dataResults.benchmark;
                draft.data.benchmark.statistics = statisticsResults.benchmark;
            }

            draft.data.fundListCompare = draft.data.fundListCompare.map(fund => {
                // If there's a dataResult for a CNPJ, the fund's data was updated
                if (dataResults[fund.cnpj]) {
                    if (dataResults[fund.cnpj].data instanceof Error) {
                        Sentry.captureException(dataResults[fund.cnpj].data);
                        fund.data = dataResults[fund.cnpj].data;
                    } else fund.data = dataResults[fund.cnpj].data;

                    if (statisticsResults[fund.cnpj] instanceof Error) {
                        Sentry.captureException(statisticsResults[fund.cnpj]);
                        fund.statistics = statisticsResults[fund.cnpj];
                    } else fund.statistics = statisticsResults[fund.cnpj];

                    if (dataResults[fund.cnpj].detail instanceof Error) {
                        Sentry.captureException(dataResults[fund.cnpj].detail);
                        fund.detail = dataResults[fund.cnpj].detail;
                    } else {
                        if (dataResults[fund.cnpj].detail.length === 0) fund.detail = 'Não encontrado';
                        else {
                            fund.detail = {
                                name: dataResults[fund.cnpj].detail[0].f_short_name,
                                benchmark: dataResults[fund.cnpj].detail[0].icf_rentab_fundo
                            };
                        }
                    }
                }

                return fund;
            });

            // Every state change results in the chart being updated
            // We don't check draft.data.fundListCompare for erros, because the chart can be shown without the funds (it's only necessary the benchmark data)
            if (dataResults.benchmark && dataResults.benchmark instanceof Error) {
                Sentry.captureException(dataResults.benchmark);
                draft.data.chartSmall = dataResults.benchmark;
                draft.data.chartLarge = dataResults.benchmark;
            } else if (dataResults.benchmark && dataResults.benchmark.statistics instanceof Error) {
                Sentry.captureException(dataResults.benchmark.statistics);
                draft.data.chartSmall = dataResults.benchmark.statistics;
                draft.data.chartLarge = dataResults.benchmark.statistics;
            } else {
                draft.data.chartSmall = buildChart(field, draft.data.benchmark, draft.data.fundListCompare, 'small');
                draft.data.chartLarge = buildChart(field, draft.data.benchmark, draft.data.fundListCompare, 'large');
            }
        });

        // Calculate the correlation matrix of the not errored funds and benchmark
        const notErroredFunds = fundHistory => !(fundHistory.data instanceof Error);
        const notErroredBenchmark = !(nextState.data.benchmark.data instanceof Error);

        const fundsHistory = nextState.data.fundListCompare.filter(notErroredFunds).map(fund => fund.data);
        const fundsHeader = nextState.data.fundListCompare.filter(notErroredFunds).map(fund => fund.detail.name);
        const benchmarksHistory = notErroredBenchmark ? [nextState.data.benchmark.data] : [];
        const benchmarkHeader = notErroredBenchmark ? [nextState.data.benchmark.name.toUpperCase()] : [];

        const data = await statisticsServiceInstance.calculateCorrelationMatrix(fundsHistory, benchmarksHistory, benchmark);
        nextState = produce(nextState, draft => {
            draft.data.correlationMatrix = {
                headers: benchmarkHeader.concat(fundsHeader),
                data
            };
        });

        setOldState(nextState);
    }, []);

    const updateSearchData = useCallback(async function updateSearchData(searchConfig) {
        if (searchConfig.search !== '') {
            const result = await settle(fetchFundList(searchConfig));

            if (!isError(result)) {
                setSearchData(draft => {
                    draft.fundListSearch = result.data;
                    draft.totalRows = result.totalRows;
                });
            } else {
                setSearchData(draft => {
                    draft.fundListSearch = result;
                    draft.totalRows = emptyState.new.data.search.totalRows;
                });
            }

            reportErrorIfNecessary(result);
        } else {
            setSearchData(() => emptyState.new.data.search);
        }
    }, []);

    // Effects
    useEffect(() => {
        setSearchData(draft => {
            draft.fundListSearch = null;
            draft.totalRows = emptyState.new.data.search.totalRows;
        });
        updateSearchData(searchConfig);
    }, [updateSearchData, searchConfig]);

    useEffect(() => {
        updateData(oldState, field, benchmark, range);
    }, []);

    useEffect(() => {
        const nextState = produce(oldState, draft => {
            draft.data.fundListCompare = draft.data.fundListCompare.map(fund => {
                fund.data = null;
                fund.statistics = null;
                return fund;
            });
            draft.data.benchmark.data = null;
            draft.data.benchmark.statistics = null;
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
            draft.data.correlationMatrix = null;
        });
        updateData(nextState, field, benchmark, range);
    }, [range]);

    useEffect(() => {
        const nextState = produce(oldState, draft => {
            draft.data.fundListCompare = draft.data.fundListCompare.map(fund => {
                fund.data = null;
                fund.statistics = null;
                return fund;
            });
            draft.data.benchmark = {
                name: benchmarkOptions.find(benchmarkItem => benchmarkItem.name === benchmark).displayName,
                data: null
            };
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
            draft.data.correlationMatrix = null;
        });
        updateData(nextState, field, benchmark, range);
    }, [benchmark]);

    useEffect(() => {
        const nextState = produce(oldState, draft => {
            draft.data.chartSmall = null;
            draft.data.chartLarge = null;
        });
        updateData(nextState, field, benchmark, range);
    }, [field]);

    useEffect(() => {
        function effect(fundsToCompare) {
            // Find the new funds to compare
            const newFundsToAdd = [];
            const newFundsToRemove = [];
            fundsToCompare.forEach(fundToCompareItem => {
                if (!oldState.data.fundListCompare.find(fundListCompareItem => fundToCompareItem === fundListCompareItem.cnpj)) {
                    newFundsToAdd.push(fundToCompareItem);
                }
            });
            oldState.data.fundListCompare.forEach(fundListCompareItem => {
                if (!fundsToCompare.find(fundToCompareItem => fundToCompareItem === fundListCompareItem.cnpj)) {
                    newFundsToRemove.push(fundListCompareItem.cnpj);
                }
            });

            if (newFundsToAdd.length > 0 || newFundsToRemove.length > 0) {
                const nextState = produce(oldState, draft => {
                    newFundsToAdd.forEach(newFundToAdd => {
                        if (!draft.data.fundListCompare.find(existingFund => existingFund.cnpj === newFundToAdd)) {
                            // TODO: It should come from a initial state variable
                            draft.data.fundListCompare.push({
                                cnpj: newFundToAdd,
                                detail: null,
                                data: null,
                                statistics: null
                            });
                        }
                    });

                    newFundsToRemove.forEach(newFundToRemove => {
                        draft.data.fundListCompare = draft.data.fundListCompare.filter(fundItem => fundItem.cnpj !== newFundToRemove);
                    });
                });
                updateData(nextState, field, benchmark, range);
            }
        }

        effect(fundsToCompare);

    }, [fundsToCompare]);

    // Fetchers
    function fetchBenchmarkHistory(benchmark, range) {
        const from = rangeOptions.find(rangeItem => rangeItem.name === range).toDate();

        return API.getBenchmarkHistory(benchmark, from);
    }

    function fetchFundData(cnpj) {
        return API.getFundData(cnpj);
    }

    function fetchFundList(config) {
        return API.getFundList(config);
    }

    function fetchFundHistory(cnpj, benchmark, range) {
        const from = rangeOptions.find(rangeItem => rangeItem.name === range).toDate();

        return API.getFundHistory(cnpj, benchmark, from);
    }

    // Handlers
    function handleSearchChange(search) {
        setSearchConfig(draft => {
            draft.search = search;
            draft.page = emptyState.new.config.search.page;
        });
    }

    function handleChangePage(object, page) {
        setSearchConfig(draft => {
            draft.page = page;
        });
    }

    // TODO: Improve "Sem dados à exibir" message

    function handleChangeRowsPerPage(event) {
        setSearchConfig(draft => {
            draft.rowsPerPage = event.target.value;
        });
    }

    function handleTabChange(event, value) {
        setSelectedTab(value);
    };

    function handleConfigFieldChange(event) {
        setField(event.target.value);
    }

    function handleConfigRangeChange(event) {
        setRange(event.target.value);
    }

    function handleConfigBenchmarkChange(event) {
        setBenchmark(event.target.value);
    }

    function handleAddClick(fund) {
        setFundsToCompare([
            ...fundsToCompare,
            fund.icf_cnpj_fundo
        ]);
        setSearchConfig(draft => {
            draft.search = emptyState.new.config.search.search;
            draft.page = emptyState.new.config.search.page;
        });
    }

    function handleRemoveClick(fund) {
        setFundsToCompare(fundsToCompare.filter(fundToCompare => fundToCompare !== fund.cnpj));
    }

    function handleChartInitialized(figure) {
        setOldState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.chartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.chartLarge = figure;
        }));
    }

    function handleChartUpdate(figure) {
        setOldState(produce(draft => {
            if (figure.layout.size === 'small') draft.data.chartSmall = figure;
            else if (figure.layout.size === 'large') draft.data.chartLarge = figure;
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
                                    <p>Comparador de desempenho de fundos.</p>
                                    <p>No lado direito é possível alterar o benchmark e intervalo visualizado.</p>
                                    <p>Procure um fundo e o adicione na lista para inicar a comparação.</p>
                                </React.Fragment>
                            }><Typography variant="h5" className={styles.withTooltip}>Comparação de Fundos</Typography></Tooltip>
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
                                {rangeOptions.filter(range => range.name !== 'all').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                            </Select>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs>
                    <Paper elevation={1} square={true} >
                        <Grid container wrap="nowrap" className={styles.optionsBar}>
                            <FundSearchComponent key={searchConfig.search} term={searchConfig.search} onSearchChanged={handleSearchChange} />
                        </Grid>
                    </Paper>
                    <ShowStateComponent
                        data={searchData.fundListSearch}
                        isEmpty={() => searchConfig.search === '' ? (<React.Fragment></React.Fragment>) : (<Paper elevation={1} square={true} className={styles.optionsBar}><Typography variant="subtitle1" align="center">Sem dados à exibir</Typography></Paper>)}
                        hasData={() => (
                            <Paper elevation={1} square={true} className={styles.optionsBar}>
                                {
                                    searchData.fundListSearch.map((fund, index) => (
                                        <Grid key={index} container spacing={1} alignItems="center" justify="center">
                                            <Grid item xs={7}>
                                                <Typography variant="body2">
                                                    <b><Link to={'/funds/' + fund.f_cnpj} className={styles.link}>{fund.f_short_name}</Link></b><br />
                                                    <small>
                                                        <b>Patrimônio:</b> {formatters.field['iry_accumulated_networth'](fund.iry_accumulated_networth)}<br />
                                                        <b>Quotistas:</b> {fund.iry_accumulated_quotaholders} <br />
                                                        <b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](fund.icf_rentab_fundo)}
                                                    </small>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2"><b>Desempenho</b></Typography>
                                                    </Grid>
                                                    <Hidden smDown>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2"><b>Risco</b></Typography>
                                                        </Grid>
                                                    </Hidden>
                                                </Grid>
                                                <Grid container spacing={1}>
                                                    <Grid item sm={6} xs={12}>
                                                        <Typography variant="body2">
                                                            <small>
                                                                1A: {formatters.field['iry_investment_return_1y'](fund.iry_investment_return_1y)}<br />
                                                                2A: {formatters.field['iry_investment_return_2y'](fund.iry_investment_return_2y)}<br />
                                                                3A: {formatters.field['iry_investment_return_3y'](fund.iry_investment_return_3y)}
                                                            </small>
                                                        </Typography>
                                                    </Grid>
                                                    <Hidden smDown>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2">
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
                                                <Typography variant="body2" align="center" >
                                                    <Tooltip title="Adicionar" aria-label="Adicionar">
                                                        <IconButton className={styles.button}
                                                            onClick={() => handleAddClick(fund)}>
                                                            <AddIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    ))
                                }
                                {searchData.totalRows ?
                                    <TablePagination
                                        component="div"
                                        count={searchData.totalRows}
                                        rowsPerPage={searchConfig.rowsPerPage}
                                        page={searchConfig.page}
                                        backIconButtonProps={{
                                            'aria-label': 'Página Anterior',
                                        }}
                                        nextIconButtonProps={{
                                            'aria-label': 'Próxima Página',
                                        }}
                                        onChangePage={handleChangePage}
                                        onChangeRowsPerPage={handleChangeRowsPerPage}
                                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                                        labelRowsPerPage={isSMUp ? 'Registros por página:' : ''}
                                        rowsPerPageOptions={[5, 10, 25, 50, 100]}
                                    />
                                    : null}
                            </Paper>
                        )}
                        isNull={() => (
                            <Paper elevation={1} square={true} className={styles.optionsBar}>
                                {
                                    [...Array(searchConfig.rowsPerPage).keys()].map((fund, index) => (
                                        <Grid key={index} container spacing={1} alignItems="center" justify="center">
                                            <Grid item xs={7}>
                                                <Typography variant="body2">
                                                    <Skeleton />
                                                    <small>
                                                        <Skeleton />
                                                        <Skeleton />
                                                        <Skeleton />
                                                    </small>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2"><Skeleton /></Typography>
                                                    </Grid>
                                                    <Hidden smDown>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2"><Skeleton /></Typography>
                                                        </Grid>
                                                    </Hidden>
                                                </Grid>
                                                <Grid container spacing={1}>
                                                    <Grid item sm={6} xs={12}>
                                                        <Typography variant="body2">
                                                            <small>
                                                                <Skeleton />
                                                                <Skeleton />
                                                                <Skeleton />
                                                            </small>
                                                        </Typography>
                                                    </Grid>
                                                    <Hidden smDown>
                                                        <Grid item xs={6}>
                                                            <Typography variant="body2">
                                                                <small>
                                                                    <Skeleton />
                                                                    <Skeleton />
                                                                    <Skeleton />
                                                                </small>
                                                            </Typography>
                                                        </Grid>
                                                    </Hidden>
                                                </Grid>
                                            </Grid>
                                            <Grid item xs={1}>
                                                <Typography variant="body2" align="center" >
                                                    <Skeleton />
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    ))
                                }
                            </Paper>
                        )}
                        isErrored={() => (<Paper elevation={1} square={true} className={styles.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs>
                    <Paper elevation={1} square={true} className={styles.chart} >
                        <Hidden smDown>
                            <Tabs
                                value={selectedTab}
                                onChange={handleTabChange}
                                classes={{ root: styles.tabsRoot, indicator: styles.tabsIndicator }}>
                                <Tab label="Gráfico" />
                                <Tab label="Matriz de Correlação" />
                            </Tabs>
                        </Hidden>
                        {(selectedTab === 0 || isSMDown) && <React.Fragment>
                            <Hidden smDown>
                                <DataHistoryChartComponent
                                    data={oldState.data.chartLarge}
                                    onInitialized={figure => handleChartInitialized(figure)}
                                    onUpdate={figure => handleChartUpdate(figure)} />
                            </Hidden>
                            <Hidden mdUp>
                                <DataHistoryChartComponent
                                    data={oldState.data.chartSmall}
                                    onInitialized={figure => handleChartInitialized(figure)}
                                    onUpdate={figure => handleChartUpdate(figure)} />
                            </Hidden>
                        </React.Fragment>}
                        {(selectedTab === 1 && !isSMDown) && <React.Fragment>
                            <ShowStateComponent
                                data={oldState.data.correlationMatrix}
                                hasData={() => (
                                    <table className={styles.historyTable}>
                                        <thead>
                                            <tr className={styles.historyCell}>
                                                <th className={styles.historyCell}>&nbsp;</th>
                                                {oldState.data.correlationMatrix.headers.map((correlationItem, index) => (
                                                    <th key={`head${correlationItem}`} className={styles.historyCell} style={{ borderWidth: '0px 0px 5px 0px', borderColor: nextColorIndex(index), borderStyle: 'solid' }}>
                                                        <Typography variant="body2" className={styles.textOverflowDynamicContainer}>
                                                            <span className={styles.textOverflowDynamicEllipsis}>
                                                                <b title={correlationItem}>
                                                                    {correlationItem}
                                                                </b>
                                                            </span>
                                                        </Typography>
                                                    </th>))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {oldState.data.correlationMatrix.headers.map((name, index) => {
                                                const restOfCorrelations = oldState.data.correlationMatrix.headers.slice(index + 1);
                                                const correlationMirror = restOfCorrelations.map((name, indexCol) => {
                                                    const correlation = oldState.data.correlationMatrix.data[index + indexCol + 1][index];
                                                    return (
                                                        <td key={`bodyreverse${name}${index}`} className={styles.historyCell} style={{ backgroundColor: getGradientColor('#FFFFFF', '#E6194B', Math.abs(correlation)) }}>
                                                            <Typography variant="body2" style={{ color: Math.abs(correlation) > 0.3 ? '#FFFFFF' : '#000000' }}>
                                                                {formatters.percentage(oldState.data.correlationMatrix.data[index + indexCol + 1][index])}
                                                            </Typography>
                                                        </td>
                                                    );
                                                });
                                                return (<tr key={`row${name}`}>
                                                    <th style={{ minWidth: '100px', borderWidth: '0px 5px 0px 0px', borderColor: nextColorIndex(index), borderStyle: 'solid' }}><Typography className={styles.textOverflowDynamicContainer}><span className={styles.textOverflowDynamicEllipsis} title={name}><b>{name}</b></span></Typography></th>
                                                    {oldState.data.correlationMatrix.data[index].map(correlation => (
                                                        <td key={`body${name}${index}${correlation}`} className={styles.historyCell} style={{ backgroundColor: getGradientColor('#FFFFFF', '#E6194B', Math.abs(correlation)) }}>
                                                            <Typography variant="body2" style={{ color: Math.abs(correlation) > 0.3 ? '#FFFFFF' : '#000000' }}>
                                                                {formatters.percentage(correlation)}
                                                            </Typography>
                                                        </td>)
                                                    )}
                                                    {correlationMirror}
                                                </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                isNull={() => (<Typography variant="subtitle1" align="center"><Skeleton variant="rect" height={300} /></Typography>)}
                                isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                            />
                        </React.Fragment>}
                    </Paper>
                </Grid>
            </Grid >
            <Grid container spacing={2}>
                <Grid item xs>
                    <Paper elevation={1} square={true} className={styles.optionsBar}>
                        <Grid container spacing={1} key={benchmark} alignItems="center">
                            <Grid item xs>
                                <Grid container spacing={1}>
                                    <Grid item>
                                        <Typography variant="body2">&nbsp;</Typography>
                                    </Grid>
                                    <Grid item xs>
                                        <Typography variant="body2" align="center">
                                            <b>Nome do Fundo</b>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <ShowStateComponent
                                data={oldState.data.benchmark.statistics}
                                hasData={() => {
                                    let availableSlots = 0;

                                    if (isLGUp) availableSlots = 5;
                                    else if (isMDUp) availableSlots = 4;
                                    else if (isSMUp) availableSlots = 1;
                                    else if (isXSUp) availableSlots = 0;

                                    let fields = ['investment_return', 'relative_investment_return', 'correlation', 'risk', 'sharpe', 'consistency'];
                                    const selectedFields = [];

                                    fields = fields.filter(fieldItem => fieldItem !== field);
                                    selectedFields.push(field);

                                    Array(availableSlots).fill(null).forEach(slot => {
                                        selectedFields.push(fields.shift());
                                    });

                                    return (
                                        <Grid item xs={4} sm={6} md={7} lg={9}>
                                            <Grid container spacing={1} alignItems="center" justify="center">
                                                {
                                                    selectedFields.map(field => (
                                                        <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                            <Typography variant="body2" align="center"><b>{fieldOptions.find(fieldItem => fieldItem.name === field).displayName}</b></Typography>
                                                        </Grid>))
                                                }
                                            </Grid>
                                        </Grid>
                                    );
                                }}
                                isNull={() => {
                                    let availableSlots = 0;

                                    if (isLGUp) availableSlots = 5;
                                    else if (isMDUp) availableSlots = 4;
                                    else if (isSMUp) availableSlots = 1;
                                    else if (isXSUp) availableSlots = 0;

                                    return (
                                        <Grid item xs={4} sm={6} md={7} lg={9}>
                                            <Grid container spacing={1} alignItems="center" justify="center">
                                                {
                                                    [...Array(availableSlots).keys()].map(field => (
                                                        <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                            <Typography variant="body2" align="center"><b><Skeleton /></b></Typography>
                                                        </Grid>))
                                                }
                                            </Grid>
                                        </Grid>
                                    );
                                }}
                                isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                            />
                            <Grid item xs={1}>
                                <Typography variant="body2">&nbsp;</Typography>
                            </Grid>
                        </Grid>
                        <ShowStateComponent
                            data={oldState.data.benchmark}
                            hasData={() => (
                                <Grid container spacing={2} key={benchmark} alignItems="center">
                                    <Grid item xs>
                                        <Grid container spacing={1}>
                                            <Grid item>
                                                <span style={{ backgroundColor: nextColorIndex(0), minWidth: '10px', height: '100%', display: 'block' }}></span>
                                            </Grid>
                                            <Grid item xs>
                                                <Typography variant="body2" className={styles.benchmarkCell}><b>{oldState.data.benchmark.name.toUpperCase()}</b></Typography>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <ShowStateComponent
                                        data={oldState.data.benchmark.statistics}
                                        hasData={() => {
                                            let availableSlots = 0;

                                            if (isLGUp) availableSlots = 5;
                                            else if (isMDUp) availableSlots = 4;
                                            else if (isSMUp) availableSlots = 1;
                                            else if (isXSUp) availableSlots = 0;

                                            let fields = ['investment_return', 'relative_investment_return', 'correlation', 'risk', 'sharpe', 'consistency'];
                                            const selectedFields = [];

                                            fields = fields.filter(fieldItem => fieldItem !== field);
                                            selectedFields.push(field);

                                            Array(availableSlots).fill(null).forEach(slot => {
                                                selectedFields.push(fields.shift());
                                            });

                                            return (
                                                <Grid item xs={4} sm={6} md={7} lg={9}>
                                                    <Grid container spacing={1} alignItems="center" justify="center">
                                                        {
                                                            selectedFields.map(field => (
                                                                <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                    {oldState.data.benchmark.statistics.accumulated[field] ? (<Typography variant="body2" align="center">{formatters.field[field](oldState.data.benchmark.statistics.accumulated[field])}</Typography>) : (<Typography variant="body2" align="center">-</Typography>)}
                                                                </Grid>))
                                                        }
                                                    </Grid>
                                                </Grid>
                                            );
                                        }}
                                        isNull={() => {
                                            let availableSlots = 0;

                                            if (isLGUp) availableSlots = 5;
                                            else if (isMDUp) availableSlots = 4;
                                            else if (isSMUp) availableSlots = 1;
                                            else if (isXSUp) availableSlots = 0;

                                            return (
                                                <Grid item xs={4} sm={6} md={7} lg={9}>
                                                    <Grid container spacing={1} alignItems="center" justify="center">
                                                        {
                                                            [...Array(availableSlots).keys()].map(field => (
                                                                <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                    <Typography variant="body2" align="center"><Skeleton /></Typography>
                                                                </Grid>))
                                                        }
                                                    </Grid>
                                                </Grid>
                                            );
                                        }}
                                        isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                                    />
                                    <Grid item xs={1}>
                                        <Typography variant="body2">&nbsp;</Typography>
                                    </Grid>
                                </Grid>
                            )
                            }
                            isNull={() => (<Typography variant="subtitle1" align="center"><Skeleton /></Typography>)}
                            isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                        />
                        <ShowStateComponent
                            data={oldState.data.fundListCompare}
                            hasData={() => (
                                <React.Fragment>
                                    {
                                        oldState.data.fundListCompare.map((fundObject, index) => (
                                            <Grid container spacing={1} key={index} alignItems="center" justify="center">
                                                <ShowStateComponent
                                                    data={fundObject.detail}
                                                    hasData={() => (
                                                        <Grid item xs>
                                                            <Grid container spacing={1}>
                                                                <Grid item>
                                                                    <span style={{ backgroundColor: nextColorIndex(index + 1), minWidth: '10px', height: '100%', display: 'block' }}></span>
                                                                </Grid>
                                                                <Grid item xs>
                                                                    <Typography variant="body2">
                                                                        <b><Link to={'/funds/' + fundObject.cnpj} className={styles.link}>{fundObject.detail.name}</Link></b><br />
                                                                        <small>
                                                                            <b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](fundObject.detail.benchmark)}
                                                                        </small>
                                                                    </Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </Grid>
                                                    )}
                                                    isNull={() => (
                                                        <Grid item xs>
                                                            <Grid container spacing={1}>
                                                                <Grid item>
                                                                    <span style={{ backgroundColor: nextColorIndex(index + 1), minWidth: '10px', height: '100%', display: 'block' }}></span>
                                                                </Grid>
                                                                <Grid item xs>
                                                                    <Typography variant="body2">
                                                                        <Skeleton />
                                                                    </Typography>
                                                                </Grid>
                                                            </Grid>
                                                        </Grid>
                                                    )}
                                                    isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
                                                />
                                                <ShowStateComponent
                                                    data={fundObject.statistics}
                                                    hasData={() => {
                                                        let availableSlots = 0;

                                                        if (isLGUp) availableSlots = 5;
                                                        else if (isMDUp) availableSlots = 4;
                                                        else if (isSMUp) availableSlots = 1;
                                                        else if (isXSUp) availableSlots = 0;

                                                        let fields = ['investment_return', 'relative_investment_return', 'correlation', 'risk', 'sharpe', 'consistency'];
                                                        const selectedFields = [];

                                                        fields = fields.filter(fieldItem => fieldItem !== field);
                                                        selectedFields.push(field);

                                                        Array(availableSlots).fill(null).forEach(slot => {
                                                            selectedFields.push(fields.shift());
                                                        });

                                                        return (
                                                            <Grid item xs={4} sm={6} md={7} lg={9}>
                                                                <Grid container spacing={1} key={index} alignItems="center" justify="center">
                                                                    {
                                                                        selectedFields.map(field => (
                                                                            <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                                {fundObject.statistics.accumulated[field] ? (<Typography variant="body2" align="center">{formatters.field[field](fundObject.statistics.accumulated[field])}</Typography>) : (<Typography variant="body2">&nbsp;</Typography>)}
                                                                            </Grid>))
                                                                    }
                                                                </Grid>
                                                            </Grid>
                                                        );
                                                    }}
                                                    isNull={() => {
                                                        let availableSlots = 0;

                                                        if (isLGUp) availableSlots = 5;
                                                        else if (isMDUp) availableSlots = 4;
                                                        else if (isSMUp) availableSlots = 1;
                                                        else if (isXSUp) availableSlots = 0;

                                                        return (
                                                            <Grid item xs={4} sm={6} md={7} lg={9}>
                                                                <Grid container spacing={1} key={index} alignItems="center" justify="center">
                                                                    {
                                                                        [...Array(availableSlots).keys()].map(field => (
                                                                            <Grid item key={field} xs={12} sm={6} md={3} lg={2}>
                                                                                <Typography variant="body2" align="center"><Skeleton /></Typography>
                                                                            </Grid>))
                                                                    }
                                                                </Grid>
                                                            </Grid>
                                                        );
                                                    }}
                                                />
                                                <Grid item xs={1}>
                                                    <Typography variant="body2" align="center">
                                                        <Tooltip title="Remover" aria-label="Remover">
                                                            <IconButton className={styles.button}
                                                                onClick={() => handleRemoveClick(fundObject)}>
                                                                <ClearIcon color="error" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        ))
                                    }
                                </React.Fragment>
                            )}
                            isNull={() => (<Paper elevation={1} square={true} className={styles.filterPaperContent}><Typography variant="subtitle1" align="center"><Skeleton /></Typography></Paper>)}
                            isErrored={() => (<Paper elevation={1} square={true} className={styles.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </div >
    );
}

export default FundComparisonView;