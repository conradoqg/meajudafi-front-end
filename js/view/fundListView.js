import React from 'react';
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
import { produce, setAutoFreeze } from 'immer';
import CircularProgress from '@material-ui/core/CircularProgress';
import Select from '@material-ui/core/Select';
import Avatar from '@material-ui/core/Avatar';
import Tooltip from '@material-ui/core/Tooltip';
import Grey from '@material-ui/core/colors/grey';
import API from '../api';
import FundFilterComponent from './components/fundFilterComponent';
import FundSearchComponent from './components/fundSearchComponent';
import ShowStateComponent from './components/showStateComponent';
import * as d3Format from 'd3-format';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly';
import allKeys from 'promise-results/allKeys';
import ptBR from 'd3-format/locale/pt-BR.json';
import { sortOptions, benchmarkOptions, rangeOptions } from './options';
import { nextColorIndex } from '../util';

const Plot = createPlotlyComponent(Plotly);
d3Format.formatDefaultLocale(ptBR);

setAutoFreeze(false);

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
    help: {
        margin: 10,
        backgroundColor: Grey[600],
        width: 17,
        height: 17,
        fontSize: 10,
        fontWeight: 'bold'
    }
});

// TODO: This should be moved to styles, but I need to understand how to do it
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
        },
    },
};

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
            console.error(ex.message);
            this.setState(produce(nextState, draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleSearchChanged = async (search) => {
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
            if (this.state.layout.showingFundDetail[key]) this.updateChart(true, nextState.config.chart, key);
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

    handleFilterChanged = async (filter) => {
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

        this.updateChart(expanded, this.state.config.chart, fund.icf_cnpj_fundo);
    }

    updateChart = async (expanded, chartConfig, cnpj) => {
        try {
            const data = (expanded ? await this.getFundDetail(cnpj, chartConfig) : null);

            this.setState(produce(draft => {
                draft.data.fundDetail[cnpj] = data;
            }));
        } catch (ex) {
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundDetail[cnpj] = ex.message;
            }));
        }
    }

    async getFundList(options) {
        return API.getFundList(options);
    }

    async getFundDetail(cnpj, chartConfig) {
        let colorIndex = 0;

        const from = rangeOptions.find(range => range.name == chartConfig.range).toDate();

        const benchmarkText = benchmarkOptions.find(benchmark => benchmark.name == chartConfig.benchmark).displayName;

        const { statistics, infCadastral } = await allKeys({
            statistics: API.getFundStatistic(cnpj, chartConfig.benchmark, from),
            infCadastral: API.getFundData(cnpj)
        });

        const name = infCadastral[0].f_short_name;

        let min_y = Math.min(statistics.min_investment_return, statistics.min_benchmark_investment_return);
        let max_y = Math.max(statistics.max_investment_return, statistics.max_benchmark_investment_return);

        return {
            data: [
                {
                    x: statistics.date,
                    y: statistics.investment_return,
                    type: 'scatter',
                    name: 'Desempenho',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.date,
                    y: statistics.benchmark_investment_return,
                    type: 'scatter',
                    name: `Benchmark (${benchmarkText})`,
                    yaxis: 'y2',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.date,
                    y: statistics.risk,
                    type: 'scatter',
                    name: 'Risco',
                    yaxis: 'y3',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.date,
                    y: statistics.sharpe,
                    type: 'scatter',
                    name: 'Sharpe',
                    yaxis: 'y4',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.date,
                    y: statistics.benchmark_consistency,
                    type: 'scatter',
                    name: 'Consistência',
                    yaxis: 'y5',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.date,
                    y: statistics.networth,
                    type: 'scatter',
                    name: 'Patrimônio',
                    yaxis: 'y6',
                    line: { color: nextColorIndex(colorIndex++) }
                },
                {
                    x: statistics.date,
                    y: statistics.quotaholders,
                    type: 'scatter',
                    name: 'Cotistas',
                    yaxis: 'y7',
                    line: { color: nextColorIndex(colorIndex++) }
                }
            ],
            layout: {
                title: name,
                separators: ',.',
                autosize: true,
                showlegend: true,
                legend: { 'orientation': 'h' },
                xaxis: {
                    showspikes: true,
                    spikemode: 'across',
                    domain: [0.05, 0.74]
                },
                yaxis: {
                    title: 'Desempenho',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    fixedrange: true,
                    range: [min_y, max_y],
                },
                yaxis2: {
                    title: `Benchmark (${benchmarkText})`,
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'left',
                    range: [min_y, max_y],
                    fixedrange: true,
                    position: 0
                },
                yaxis3: {
                    title: 'Risco',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true
                },
                yaxis4: {
                    title: 'Sharpe',
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.78
                },
                yaxis5: {
                    title: 'Consistência',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.84
                },
                yaxis6: {
                    title: 'Patrimônio',
                    type: 'linear',
                    tickprefix: 'R$ ',
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
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
            }
        };
    }

    async componentDidMount() {
        try {
            const result = await this.getFundList(this.state.config);

            this.setState(produce(draft => {
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
            }));
        } catch (ex) {
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    render() {
        const { classes, globalClasses } = this.props;
        const { layout } = this.state;
        const open = Boolean(layout.anchorEl);

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="display1" gutterBottom>Lista de Fundos</Typography>
                        <Typography component="span" gutterBottom><Tooltip title={
                            <React.Fragment>
                                <p>Lista de fundos de investimento com gráfico diário.</p>
                                <p>Por padrão somente fundos listados na BTG Pactual e XP Investimentos são exibidos. No lado esquerdo é possível procurar fundos pelo nome e no lado direito é possível alterar o filtro, ordem, intervalo e benchmark.</p>
                                <p>Clique no fundo para visualizar o gráfico.</p>
                            </React.Fragment>
                        }><Avatar className={classes.help}>?</Avatar></Tooltip></Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} >
                            <Grid container wrap="nowrap" className={classes.optionsBar}>
                                <FundSearchComponent onSearchChanged={this.handleSearchChanged} />
                                <Grid container justify="flex-end" spacing={8}>
                                    <Grid item>
                                        <Select
                                            value={this.state.config.chart.range}
                                            onChange={this.handleChartConfigChange}
                                            className={classes.chartSelect}
                                            inputProps={{
                                                name: 'range',
                                                id: 'range',
                                            }}>
                                            {rangeOptions.map(range => (<MenuItem key={range.name} value={range.name}>{range.displayName}</MenuItem>))}
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
                                            onClose={this.handleSortClose}
                                            PaperProps={MenuProps.PaperProps}>
                                            {this.state.data.sortOptions.map((option, index) => (
                                                <MenuItem key={option.displayName + option.order} selected={option.displayName === this.state.config.sort.displayName && option.order === this.state.config.sort.order} onClick={event => this.handleSortMenuItemClick(event, index)}>
                                                    {option.displayName}&nbsp;
                                                    {option.order == 'asc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
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
                                <FundFilterComponent onFilterChanged={this.handleFilterChanged} />
                            </Collapse>
                        </Paper>
                        <ShowStateComponent
                            data={this.state.data.fundList}
                            hasData={() => this.state.data.fundList.map((fund, index) => (
                                <ExpansionPanel key={index} expanded={this.state.layout.showingFundDetail[fund.icf_cnpj_fundo] ? true : false} onChange={(e, expanded) => this.handleFundExpansion(expanded, fund)}>
                                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                        <Grid container spacing={8}>
                                            <Grid item xs={8}>
                                                <Typography>
                                                    <b>{fund.f_short_name}</b><br />
                                                    <small>
                                                        <b>Patrimônio:</b> R$ {d3Format.format(',.2f')(fund.iry_accumulated_networth)}<br />
                                                        <b>Quotistas:</b> {fund.iry_accumulated_quotaholders} <br />
                                                        <b>Benchmark:</b> {fund.icf_rentab_fundo ? fund.icf_rentab_fundo : 'Não informado'}
                                                    </small>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Grid container spacing={8}>
                                                    <Grid item xs={6}>
                                                        <Typography><b>Desempenho</b></Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography><b>Risco</b></Typography>
                                                    </Grid>
                                                </Grid>
                                                <Grid container spacing={8}>
                                                    <Grid item xs={6}>
                                                        <Typography>
                                                            <small>
                                                                1A: {d3Format.format('.2%')(fund.iry_investment_return_1y)}<br />
                                                                2A: {d3Format.format('.2%')(fund.iry_investment_return_2y)}<br />
                                                                3A: {d3Format.format('.2%')(fund.iry_investment_return_3y)}
                                                            </small>
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography>
                                                            <small>
                                                                1A: {d3Format.format('.2%')(fund.iry_risk_1y)}<br />
                                                                2A: {d3Format.format('.2%')(fund.iry_risk_2y)}<br />
                                                                3A: {d3Format.format('.2%')(fund.iry_risk_3y)}<br />
                                                            </small>
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </ExpansionPanelSummary>
                                    <Divider />
                                    <ExpansionPanelDetails>
                                        <Grid container spacing={8}>
                                            <Grid item xs>
                                                <FundHistoryChart
                                                    fund={this.state.data.fundDetail[fund.icf_cnpj_fundo]}
                                                    onInitialized={(figure) => this.handleChartInitialized(fund, figure)}
                                                    onUpdate={(figure) => this.handleChartUpdate(fund, figure)}
                                                />
                                            </Grid>
                                        </Grid>
                                    </ExpansionPanelDetails>
                                </ExpansionPanel>
                            ))}
                            isNull={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subheading" align="center"><CircularProgress className={classes.progress} /></Typography></Paper>)}
                            isErrored={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                            isEmpty={() => (<Paper elevation={1} square={true} className={classes.filterPaperContent}><Typography variant="subheading" align="center">Sem dados à exibir</Typography></Paper>)}
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

const FundHistoryChart = (props) => {
    const { fund, handleChartInitialized, handleChartUpdate } = props;

    return (
        <ShowStateComponent
            data={fund}
            hasData={() => (
                <Plot
                    key={fund.name}
                    data={fund.data}
                    layout={fund.layout}
                    config={
                        {
                            locale: 'pt-BR',
                            displayModeBar: true
                        }
                    }
                    onInitialized={handleChartInitialized}
                    onUpdate={handleChartUpdate}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                />
            )}
            isNull={() => (
                <Typography variant="subheading" align="center"><CircularProgress /></Typography>
            )}
            isErrored={() => (
                <Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>
            )}
        />);
};

module.exports = withStyles(styles)(FundListView);