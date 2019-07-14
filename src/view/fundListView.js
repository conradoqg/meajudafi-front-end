import React from 'react';
import { Link } from 'react-router-dom';
import { withStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Divider from '@material-ui/core/Divider';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import TablePagination from '@material-ui/core/TablePagination';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SortIcon from '@material-ui/icons/Sort';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import CircularProgress from '@material-ui/core/CircularProgress';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import Hidden from '@material-ui/core/Hidden';
import withWidth from '@material-ui/core/withWidth';
import { produce } from 'immer';
import promisesEach from 'promise-results';
import API from '../api';
import FundFilterComponent from './component/fundFilterComponent';
import FundSearchComponent from './component/fundSearchComponent';
import ShowStateComponent from './component/showStateComponent';
import DataHistoryChartComponent from './component/dataHistoryChartComponent';
import { sortOptions, benchmarkOptions, rangeOptions } from './option';
import { formatters, nextColorIndex, chartFormatters } from '../util';
import * as Sentry from '@sentry/browser';

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
    optionsBar: {
        padding: theme.spacing.unit
    },
    progress: {
        margin: theme.spacing.unit * 2
    },
    chartSelect: {
        margin: theme.spacing.unit
    },
    appBarSpacer: theme.mixins.toolbar,
    withTooltip: theme.withTooltip,
    link: theme.link
});

const emptyState = {
    data: {
        fundList: null,
        fundDetail: {},
        totalRows: null,
        sortOptions: sortOptions
    },
    config: {
        page: 0,
        rowsPerPage: 25,
        sort: sortOptions[0],
        filter: FundFilterComponent.emptyState.config.filter,
        chart: {
            range: 'all',
            benchmark: 'cdi'
        },
        search: FundSearchComponent.emptyState.config.search
    },
    layout: {
        anchorEl: null,
        showingFundDetail: {}
    }
};

class FundListView extends React.Component {
    state = emptyState;

    async componentDidMount() {
        try {
            const result = await this.getFundList(this.state.config);

            this.setState(produce(draft => {
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            Sentry.captureException(ex);     
            console.error(ex.message);       
            this.setState(produce(draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleChangePage = async (object, page) => {
        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        const nextState = produce(this.state, draft => {
            draft.config.page = page;
        });

        try {
            const result = await this.getFundList(nextState.config);

            this.setState(produce(nextState, draft => {
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            Sentry.captureException(ex);            
            console.error(ex.message);
            this.setState(produce(nextState, draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleChangeRowsPerPage = async (event) => {
        const nextState = produce(this.state, draft => {
            draft.config.rowsPerPage = event.target.value;
        });

        this.setState(produce(draft => {
            draft.config.rowsPerPage = emptyState.config.rowsPerPage;
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        try {
            const result = await this.getFundList(nextState.config);

            this.setState(produce(nextState, draft => {
                draft.config.rowsPerPage = event.target.value;
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            Sentry.captureException(ex);
            console.error(ex.message);
            this.setState(produce(nextState, draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleSearchChange = async (search) => {
        const nextState = produce(this.state, draft => {
            draft.config.search = search;
            draft.config.page = 0;
        });

        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        try {
            const result = await this.getFundList(nextState.config);

            this.setState(produce(nextState, draft => {
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            Sentry.captureException(ex);
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleChartConfigChange = event => {
        const nextState = produce(this.state, draft => {
            draft.config.chart[event.target.name] = event.target.value;
            draft.data.fundDetail = emptyState.data.fundDetail;
        });
        this.setState(nextState);

        for (const key in this.state.layout.showingFundDetail) {
            if (this.state.layout.showingFundDetail[key]) this.updateData(true, nextState.config.chart, key);
        }
    };

    handleSortClick = event => {
        const anchorEl = event.currentTarget;
        this.setState(produce(draft => { draft.layout.anchorEl = anchorEl; }));
    };

    handleSortClose = () => {
        this.setState(produce(draft => { draft.layout.anchorEl = null; }));
    };

    handleSortMenuItemClick = async (event, index) => {
        const nextState = produce(this.state, draft => {
            draft.config.sort = draft.data.sortOptions[index];
        });

        this.setState(produce(draft => {
            draft.layout.anchorEl = emptyState.layout.anchorEl;
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        try {
            const result = await this.getFundList(nextState.config);

            this.setState(produce(nextState, draft => {
                draft.layout.anchorEl = null;
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            Sentry.captureException(ex);
            console.error(ex.message);
            this.setState(produce(nextState, draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleFilterClick = () => {
        this.setState(produce(draft => {
            draft.layout.showingFilter = !draft.layout.showingFilter;
            draft.layout.showingChartConfig = false;
        }));
    }

    handleFilterChange = async (filter) => {
        const nextState = produce(this.state, draft => {
            draft.config.filter = filter;
        });

        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
            draft.layout.showingFilter = false;
        }));

        try {
            const result = await this.getFundList(nextState.config);

            this.setState(produce(nextState, draft => {
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            Sentry.captureException(ex);
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleChartInitialized = async (fund, figure) => {
        this.setState(produce(draft => {
            draft.data.fundDetail[fund.icf_cnpj_fundo] = figure;
        }));
    }

    handleChartUpdate = async (fund, figure) => {
        this.setState(produce(draft => {
            draft.data.fundDetail[fund.icf_cnpj_fundo] = figure;
        }));
    }

    handleFundExpansion = async (expanded, fund) => {
        this.setState(produce(draft => {
            draft.data.fundDetail[fund.icf_cnpj_fundo] = null;
            draft.layout.showingFundDetail[fund.icf_cnpj_fundo] = expanded;
        }));

        this.updateData(expanded, this.state.config.chart, fund.icf_cnpj_fundo);
    }

    updateData = async (expanded, chartConfig, cnpj) => {
        let nextState = null;

        if (expanded) {
            const { fundStatistic, fundData } = await promisesEach({
                fundStatistic: this.getFundStatistic(cnpj, chartConfig),
                fundData: this.getFundData(cnpj)
            });

            nextState = produce(this.state, draft => {
                const benchmarkText = benchmarkOptions.find(benchmark => benchmark.name === chartConfig.benchmark).displayName;

                if (fundStatistic instanceof Error) {
                    Sentry.captureException(fundStatistic);
                    draft.data.fundDetail[cnpj] = fundStatistic;
                } else if (fundData instanceof Error) {
                    Sentry.captureException(fundData);
                    draft.data.fundDetail[cnpj] = fundData;
                }
                else draft.data.fundDetail[cnpj] = this.buildChart(fundStatistic, fundData, benchmarkText);
            })
        }

        this.setState(nextState);
    }

    buildChart = (statistics, infCadastral, benchmarkText) => {
        let colorIndex = 0;

        const name = infCadastral[0].f_short_name;

        let min_y = Math.min(statistics.daily.min_investment_return, statistics.daily.min_benchmark_investment_return);
        let max_y = Math.max(statistics.daily.max_investment_return, statistics.daily.max_benchmark_investment_return);

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
                forSize: this.props.width,
                font: {
                    family: '"Roboto", "Helvetica", "Arial", sans-serif'
                },
                xaxis: {
                    showspikes: true,
                    spikemode: 'across',
                    domain: [0.05, 0.74]
                },
                yaxis: {
                    title: 'Desempenho',
                    tickformat: chartFormatters.investment_return.tickformat,
                    hoverformat: chartFormatters.investment_return.hoverformat,
                    fixedrange: true,
                    range: [min_y, max_y],
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
                    position: 0
                },
                yaxis3: {
                    title: 'Risco',
                    tickformat: chartFormatters.risk.tickformat,
                    hoverformat: chartFormatters.risk.hoverformat,
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true
                },
                yaxis4: {
                    title: 'Sharpe',
                    tickformat: chartFormatters.sharpe.tickformat,
                    hoverformat: chartFormatters.sharpe.hoverformat,
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.78
                },
                yaxis5: {
                    title: 'Consistência',
                    tickformat: chartFormatters.consistency.tickformat,
                    hoverformat: chartFormatters.consistency.hoverformat,
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.84
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
                    position: 0.89
                },
                yaxis7: {
                    title: 'Cotistas',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 1
                }
            },
            frames: [],
            config: {
                locale: 'pt-BR',
                displayModeBar: true
            }
        };
    }

    getFundList = async (options) => {
        return API.getFundList(options);
    }

    getFundStatistic = async (cnpj, chartConfig) => {
        const from = rangeOptions.find(range => range.name === chartConfig.range).toDate();

        return API.getFundStatistic(cnpj, chartConfig.benchmark, from);
    }

    getFundData = async (cnpj) => {
        return API.getFundData(cnpj);
    }

    render() {
        const { classes } = this.props;
        const { layout } = this.state;
        const open = Boolean(layout.anchorEl);

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Grid container spacing={16} alignItems="center">
                    <Grid item xs>
                        <Grid container alignItems="center" spacing={8}>
                            <Grid item>
                                <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                    <React.Fragment>
                                        <p>Lista de fundos de investimento com gráfico diário.</p>
                                        <p>Por padrão somente fundos listados na BTG Pactual, XP Investimentos e Modal Mais são exibidos. No lado esquerdo é possível procurar fundos pelo nome e no lado direito é possível alterar o filtro, ordem, intervalo e benchmark.</p>
                                        <p>Clique no fundo para visualizar o gráfico.</p>
                                    </React.Fragment>
                                }>
                                    <Typography variant="h5" className={classes.withTooltip}>Lista de Fundos</Typography>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} >
                            <Grid container wrap="nowrap" className={classes.optionsBar}>
                                <FundSearchComponent onSearchChanged={this.handleSearchChange} />
                                <Grid container justify="flex-end" spacing={8}>
                                    <Grid item>
                                        <Hidden smDown>
                                            <Select
                                                value={this.state.config.chart.range}
                                                onChange={this.handleChartConfigChange}
                                                className={classes.chartSelect}
                                                inputProps={{
                                                    name: 'range',
                                                    id: 'range',
                                                }}>
                                                {rangeOptions.filter(range => range.name !== 'best').map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
                                            </Select>
                                            <Select
                                                value={this.state.config.chart.benchmark}
                                                onChange={this.handleChartConfigChange}
                                                className={classes.chartSelect}
                                                inputProps={{
                                                    name: 'benchmark',
                                                    id: 'benchmark',
                                                }}>
                                                {benchmarkOptions.map(benchmark => (<MenuItem key={benchmark.name} value={benchmark.name}>{benchmark.displayName}</MenuItem>))}
                                            </Select>
                                        </Hidden>
                                        <IconButton
                                            aria-label="Ordem"
                                            aria-owns={open ? 'long-menu' : null}
                                            aria-haspopup="true"
                                            onClick={this.handleSortClick}>
                                            <SortIcon />
                                        </IconButton>
                                        <Menu
                                            id="long-menu"
                                            anchorEl={layout.anchorEl}
                                            open={open}
                                            onClose={this.handleSortClose}>
                                            {this.state.data.sortOptions.map((option, index) => (
                                                <MenuItem key={option.displayName + option.order} selected={option.displayName === this.state.config.sort.displayName && option.order === this.state.config.sort.order} onClick={event => this.handleSortMenuItemClick(event, index)}>
                                                    {option.displayName}&nbsp;
                                                    {option.order === 'asc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                                                </MenuItem>
                                            ))}
                                        </Menu>
                                        <IconButton
                                            aria-label="Filtro"
                                            onClick={this.handleFilterClick}>
                                            <FilterListIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Paper>
                        <Paper elevation={1} square={true}>
                            <Collapse in={layout.showingFilter}>
                                <FundFilterComponent onFilterChanged={this.handleFilterChange} />
                            </Collapse>
                        </Paper>
                        <ShowStateComponent
                            data={this.state.data.fundList}
                            hasData={() => this.state.data.fundList.map((fund, index) => {
                                const content = (
                                    <Grid container spacing={8}>
                                        <Grid item xs={8}>
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
                                    </Grid>
                                )
                                return (
                                    <React.Fragment key={index}>
                                        <Hidden xsDown>
                                            <ExpansionPanel expanded={this.state.layout.showingFundDetail[fund.icf_cnpj_fundo] ? true : false} onChange={(e, expanded) => this.handleFundExpansion(expanded, fund)}>
                                                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                                    {content}
                                                </ExpansionPanelSummary>
                                                <Divider />
                                                <ExpansionPanelDetails>
                                                    <Grid container spacing={8}>
                                                        <Grid item xs>
                                                            <DataHistoryChartComponent
                                                                data={this.state.data.fundDetail[fund.icf_cnpj_fundo]}
                                                                onInitialized={(figure) => this.handleChartInitialized(fund, figure)}
                                                                onUpdate={(figure) => this.handleChartUpdate(fund, figure)}
                                                            />
                                                        </Grid>
                                                    </Grid>
                                                </ExpansionPanelDetails>
                                            </ExpansionPanel>
                                        </Hidden>
                                        <Hidden smUp>
                                            <Paper elevation={1} square={true} className={classes.filterPaperContent}>
                                                {content}
                                            </Paper>
                                        </Hidden>
                                    </React.Fragment>
                                );
                            })}
                            isNull={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center"><CircularProgress className={classes.progress} /></Typography></Paper>)}
                            isErrored={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                            isEmpty={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subtitle1" align="center">Sem dados à exibir</Typography></Paper>)}
                        />
                        {this.state.data.totalRows ?
                            <TablePagination
                                component="div"
                                count={this.state.data.totalRows}
                                rowsPerPage={this.state.config.rowsPerPage}
                                page={this.state.config.page}
                                backIconButtonProps={{
                                    'aria-label': 'Página Anterior',
                                }}
                                nextIconButtonProps={{
                                    'aria-label': 'Próxima Página',
                                }}
                                onChangePage={this.handleChangePage}
                                onChangeRowsPerPage={this.handleChangeRowsPerPage}
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                                labelRowsPerPage={'Registros por página:'}
                                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                            />
                            : null}
                    </Grid>
                </Grid>
            </div >
        );
    }
}

export default withWidth()(withStyles(styles)(FundListView));