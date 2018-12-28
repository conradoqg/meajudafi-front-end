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
import ShowChartIcon from '@material-ui/icons/ShowChart';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import { produce, setAutoFreeze } from 'immer';
import CircularProgress from '@material-ui/core/CircularProgress';
import API from '../api';
import sortOptions from './sortOptions';
import { chooseState } from '../util';
import FundFilterView from './components/fundFilterView';
import FundSearchView from './components/fundSearchView';
import FundChartConfigView from './components/fundChartConfigView';
import * as d3Format from 'd3-format';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly';

const Plot = createPlotlyComponent(Plotly);

setAutoFreeze(false);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
    optionsBar: {
        padding: theme.spacing.unit
    },
    progress: {
        margin: theme.spacing.unit * 2,
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
        filter: FundFilterView.emptyState.config.filter,
        chartConfig: FundChartConfigView.emptyState.config.chartConfig,
        search: FundSearchView.emptyState.config.search
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
            this.setState(produce(draft => {
                draft.data.fundList = ex.message;
            }));
        }
    }

    handleChartConfigClick = () => {
        this.setState(produce(draft => {
            draft.layout.showingChartConfig = !draft.layout.showingChartConfig;
            draft.layout.showingFilter = false;
        }));
    }

    handleChartConfigChanged = async (chartConfig) => {
        this.setState(produce(draft => {
            draft.config.chartConfig = chartConfig;
            draft.data.fundDetail = emptyState.data.fundDetail;
            draft.layout.showingFundDetail = emptyState.layout.showingFundDetail;
            draft.layout.showingChartConfig = false;
        }));
    }

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

        try {
            const data = (expanded ? await this.getFundDetail(fund.icf_cnpj_fundo, this.state.config.chartConfig) : null);

            this.setState(produce(draft => {
                draft.data.fundDetail[fund.icf_cnpj_fundo] = data;
            }));
        } catch (ex) {
            this.setState(produce(draft => {
                draft.data.fundDetail[fund.icf_cnpj_fundo] = ex.message;
            }));
        }
    }

    async getFundList(options) {
        return API.getFundList(options);
    }

    async getFundDetail(cnpj, chartConfig) {
        let range = null;
        if (chartConfig) {
            switch (chartConfig.range) {
                case '1y':
                    range = 252;
                    break;
                case '2y':
                    range = 504;
                    break;
                case '3y':
                    range = 756;
                    break;
            }
        }
        
        let benchmarkField = 'ird_cdi_accumulated_investment_return';
        let benchmarkText = 'CDI';
        if (chartConfig) {
            switch (chartConfig.benchmarkReference) {
                case 'cdi':
                    benchmarkField = 'ird_cdi_accumulated_investment_return';
                    benchmarkText = 'CDI';

                    break;
                case 'bovespa':
                    benchmarkField = 'ird_bovespa_accumulated_investment_return';
                    benchmarkText = 'Bovespa';
                    break;
            }
        }

        let sharpeField = 'ird_cdi_sharpe_1y';
        let sharpeText = 'Sharpe 1A';
        if (chartConfig) {
            switch (chartConfig.sharpeRange) {
                case '1y':                    
                    sharpeField = benchmarkField == 'CDI' ? 'ird_cdi_sharpe_1y' : 'ird_bovespa_sharpe_1y';
                    sharpeText = 'Sharpe 1A';
                    break;
                case '2y':
                    sharpeField = benchmarkField == 'CDI' ? 'ird_cdi_sharpe_2y' : 'ird_bovespa_sharpe_2y';
                    sharpeText = 'Sharpe 2A';
                    break;
                case '3y':
                    sharpeField = benchmarkField == 'CDI' ? 'ird_cdi_sharpe_3y' : 'ird_bovespa_sharpe_3y';
                    sharpeText = 'Sharpe 3A';
                    break;
            }
        }

        let consistencyField = 'ird_cdi_consistency_1y';
        let consistencyText = 'Consistência 1A';
        if (chartConfig) {
            switch (chartConfig.sharpeRange) {
                case '1y':
                    consistencyField = benchmarkField == 'CDI' ? 'ird_cdi_consistency_1y' : 'ird_bovespa_consistency_1y';
                    consistencyText = 'Consistência 1A';
                    break;
                case '2y':
                    consistencyField = benchmarkField == 'CDI' ? 'ird_cdi_consistency_2y' : 'ird_bovespa_consistency_2y';
                    consistencyText = 'Consistência 2A';
                    break;
                case '3y':
                    consistencyField = benchmarkField == 'CDI' ? 'ird_cdi_consistency_3y' : 'ird_bovespa_consistency_3y';
                    consistencyText = 'Consistência 3A';
                    break;
            }
        }        

        const { dailyReturn, infCadastral } = await API.getFundDetail(cnpj, range);

        const initialPerformance = chartConfig && chartConfig.performanceValue == 'relative' ? dailyReturn[dailyReturn.length - 1].ird_accumulated_investment_return : 0;
        const initialRisk = chartConfig && chartConfig.riskValue == 'relative' ? dailyReturn[dailyReturn.length - 1].ird_accumulated_risk : 0;
        const initialSharpe = chartConfig && chartConfig.sharpeValue == 'relative' ? dailyReturn[dailyReturn.length - 1][sharpeField] : 0;
        const initialConsistency = chartConfig && chartConfig.consistencyValue == 'relative' ? dailyReturn[dailyReturn.length - 1][consistencyField] : 0;
        const initialNetworth = chartConfig && chartConfig.networthValue == 'relative' ? dailyReturn[dailyReturn.length - 1].ird_networth : 0;
        const initialQuotaholders = chartConfig && chartConfig.quotaholdersValue == 'relative' ? dailyReturn[dailyReturn.length - 1].ird_quotaholders : 0;
        const initialBenchmarkPerformance = chartConfig && chartConfig.benchmarkValue == 'relative' ? dailyReturn[dailyReturn.length - 1][benchmarkField] : 0;

        const name = infCadastral[0].denom_social;
        const x = [];
        const y_performance = [];
        const y_risk = [];
        const y_sharpe = [];
        const y_consistency = [];
        const y_networth = [];
        const y_quotaholders = [];
        const y_benchmark_performance = [];
        let min_y_performance = null;
        let max_y_performance = null;
        let min_y_benchmark_performance = null;
        let max_y_benchmark_performance = null;

        dailyReturn.forEach(item => {
            const ird_accumulated_investment_return = item.ird_accumulated_investment_return - initialPerformance;
            x.push(item.ird_dt_comptc);
            y_performance.push(ird_accumulated_investment_return);
            y_risk.push(item.ird_accumulated_risk - initialRisk);
            y_sharpe.push(item[sharpeField] - initialSharpe);
            y_consistency.push(item[consistencyField] - initialConsistency);
            y_networth.push(item.ird_networth - initialNetworth);
            y_quotaholders.push(item.ird_quotaholders - initialQuotaholders);
            const benchmark_accumulated_investment_return = item[benchmarkField] - initialBenchmarkPerformance;
            y_benchmark_performance.push(benchmark_accumulated_investment_return);

            min_y_performance = Math.min(min_y_performance, ird_accumulated_investment_return);
            max_y_performance = Math.max(max_y_performance, ird_accumulated_investment_return);
            min_y_benchmark_performance = Math.min(min_y_benchmark_performance, benchmark_accumulated_investment_return);
            max_y_benchmark_performance = Math.max(max_y_benchmark_performance, benchmark_accumulated_investment_return);
        });

        let min_y = Math.min(min_y_performance, min_y_benchmark_performance);
        let max_y = Math.max(max_y_performance, max_y_benchmark_performance);

        return {
            data: [
                {
                    x: x,
                    y: y_performance,
                    type: 'scatter',
                    name: 'Desempenho'
                },
                {
                    x: x,
                    y: y_benchmark_performance,
                    type: 'scatter',
                    name: `Benchmark (${benchmarkText})`,
                    yaxis: 'y2'
                },
                {
                    x: x,
                    y: y_risk,
                    type: 'scatter',
                    name: 'Risco',
                    yaxis: 'y3'
                },
                {
                    x: x,
                    y: y_sharpe,
                    type: 'scatter',
                    name: sharpeText,
                    yaxis: 'y4'
                },
                {
                    x: x,
                    y: y_consistency,
                    type: 'scatter',
                    name: consistencyText,
                    yaxis: 'y5'
                },
                {
                    x: x,
                    y: y_networth,
                    type: 'scatter',
                    name: 'Patrimônio',
                    yaxis: 'y6'
                },
                {
                    x: x,
                    y: y_quotaholders,
                    type: 'scatter',
                    name: 'Cotistas',
                    yaxis: 'y7'
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
                    title: sharpeText,
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.78
                },
                yaxis5: {
                    title: consistencyText,
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
                <Typography variant="display1" gutterBottom>Lista de Fundos</Typography>
                <Grid container spacing={16}>
                    <Grid item xs>
                        <Paper elevation={1} square={true} >
                            <Grid container wrap="nowrap" className={classes.optionsBar}>
                                <FundSearchView onSearchChanged={this.handleSearchChanged} />
                                <Grid container justify="flex-end">
                                    <Grid item>
                                        <IconButton
                                            aria-label="Configurações dos Indicadores"
                                            onClick={this.handleChartConfigClick}>
                                            <ShowChartIcon />
                                        </IconButton>
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
                            <Collapse in={layout.showingChartConfig}>
                                <FundChartConfigView onChartConfigChanged={this.handleChartConfigChanged} />
                            </Collapse>
                        </Paper>

                        <Paper elevation={1} square={true}>
                            <Collapse in={layout.showingFilter}>
                                <FundFilterView onFilterChanged={this.handleFilterChanged} />
                            </Collapse>
                        </Paper>
                        {
                            chooseState(this.state.data.fundList,
                                () => this.state.data.fundList.map((fund, index) => (
                                    <ExpansionPanel key={index} expanded={this.state.layout.showingFundDetail[fund.icf_cnpj_fundo] ? true : false} onChange={(e, expanded) => this.handleFundExpansion(expanded, fund)}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                            <Grid container spacing={8}>
                                                <Grid item xs={8}>
                                                    <Typography>
                                                        <b>{fund.icf_denom_social}</b><br />
                                                        <small>
                                                            <b>Patrimônio:</b> R$ {d3Format.format(',.2f')(fund.iry_networth)}<br />
                                                            <b>Quotistas:</b> {fund.iry_quotaholders} <br />
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
                                )),
                                () => (
                                    <Paper elevation={1} square={true} className={classes.filterPaperContent}>
                                        <Typography variant="subheading" align="center"><CircularProgress className={classes.progress} /></Typography>
                                    </Paper>
                                ),
                                () => (
                                    <Paper elevation={1} square={true} className={classes.filterPaperContent}>
                                        <Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>
                                    </Paper>
                                ),
                                () => (
                                    <Paper elevation={1} square={true} className={classes.filterPaperContent}>
                                        <Typography variant="subheading" align="center">Sem dados à exibir</Typography>
                                    </Paper>
                                )
                            )
                        }
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

    return chooseState(
        fund,
        () => (
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
        ),
        () => (
            <Typography variant="subheading" align="center"><CircularProgress /></Typography>
        ),
        () => (
            <Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>
        ));
};

module.exports = withStyles(styles)(FundListView);