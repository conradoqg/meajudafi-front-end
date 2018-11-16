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
import ReorderIcon from '@material-ui/icons/Reorder';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import SearchIcon from '@material-ui/icons/Search';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import Plot from 'react-plotly.js';
import { produce, setAutoFreeze } from 'immer';
import CircularProgress from '@material-ui/core/CircularProgress';
import API from '../api';
import sortOptions from './sortOptions';
import { formatters, chooseState } from '../util';
import FundFilterView from './components/fundFilterView';
import FundSearchView from './components/fundSearchView';

setAutoFreeze(false);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
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
        rowsPerPage: 5,
        sort: sortOptions[0]        
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
        }));
    }

    handleSearchClick = () => {
        this.setState(produce(draft => {
            draft.layout.showingSearch = !draft.layout.showingSearch;
        }));
    }

    handleSearchChanged = async (search) => {
        const nextState = produce(this.state, draft => {
            draft.config.search = search;
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

    handleFilterChanged = async (filter) => {
        const nextState = produce(this.state, draft => {
            draft.config.filter = filter;
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
            const data = (expanded ? await this.getFundDetail(fund.icf_cnpj_fundo) : null);

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

    async getFundDetail(cnpj) {
        const { dailyReturn, infCadastral } = await API.getFundDetail(cnpj);

        const x = dailyReturn.map(item => item.dt_comptc);
        const y_performance = dailyReturn.map(item => item.accumulated_investment_return);
        const y_risk = dailyReturn.map(item => item.accumulated_risk);
        const y_consistency_1y = dailyReturn.map(item => item.consistency_1y);
        const name = infCadastral[0].denom_social;

        return {
            data: [
                {
                    x: x,
                    y: y_performance,
                    type: 'scatter',
                    name: 'Performance'
                },
                {
                    x: x,
                    y: y_risk,
                    type: 'scatter',
                    name: 'Risk',
                    yaxis: 'y2'
                },
                {
                    x: x,
                    y: y_consistency_1y,
                    type: 'scatter',
                    name: 'Consistency 1Y',
                    yaxis: 'y3'
                }
            ],
            layout: {
                title: name,
                autosize: true,
                showlegend: true,
                xaxis: {
                    title: 'Data',
                    showspikes: true,
                    spikemode: 'across',
                    domain: [0, 0.96]
                },
                yaxis: {
                    title: 'Performance',
                    tickformat: '.0%',
                    hoverformat: '.2%'
                },
                yaxis2: {
                    title: 'Risk',
                    tickformat: '.0%',
                    hoverformat: '.2%',
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right'
                },
                yaxis3: {
                    title: 'Consistency 1Y',
                    tickformat: '.0%',
                    hoverformat: '.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
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
                        <Paper elevation={1} square={true}>
                            <Grid
                                container
                                direction="row"
                                justify="flex-end"
                                alignItems="center">
                                <IconButton
                                    aria-label="Procurar"
                                    onClick={this.handleSearchClick}>
                                    <SearchIcon />
                                </IconButton>
                                <IconButton
                                    aria-label="Ordem"
                                    aria-owns={open ? 'long-menu' : null}
                                    aria-haspopup="true"
                                    onClick={this.handleSortClick}>
                                    <ReorderIcon />
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
                        </Paper>

                        <Paper elevation={1} square={true}>
                            <Collapse in={layout.showingSearch} mountOnEnter unmountOnExit>
                                { layout.showingSearch ? <FundSearchView onSearchChanged={this.handleSearchChanged} /> : <div></div> }
                            </Collapse>
                        </Paper>

                        <Paper elevation={1} square={true}>
                            <Collapse in={layout.showingFilter} mountOnEnter unmountOnExit>
                                { layout.showingFilter ? <FundFilterView onFilterChanged={this.handleFilterChanged} /> : <div></div> }
                            </Collapse>
                        </Paper>
                        {
                            chooseState(this.state.data.fundList,
                                () => this.state.data.fundList.map((fund, index) => (
                                    <ExpansionPanel key={index} expanded={this.state.layout.showingFundDetail[fund.icf_cnpj_fundo]} onChange={(e, expanded) => this.handleFundExpansion(expanded, fund)}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                            <Grid container spacing={8}>
                                                <Grid item xs={8}>
                                                    <Typography>{fund.icf_denom_social}</Typography>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Grid container spacing={8}>
                                                        <Grid item xs={3}>
                                                            <Typography>Desempenho</Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography>Risco</Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography>Sharpe</Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography>Consistência</Typography>
                                                        </Grid>
                                                    </Grid>
                                                    <Grid container spacing={8}>
                                                        <Grid item xs={3}>
                                                            <Typography>
                                                                1A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_1y))}%<br />
                                                                2A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_2y))}%<br />
                                                                3A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_3y))}%
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography>
                                                                1A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_1y))}%<br />
                                                                2A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_2y))}%<br />
                                                                3A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_3y))}%<br />
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography>
                                                                1A: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_1y))}<br />
                                                                2A: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_2y))}<br />
                                                                3A: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_3y))}<br />
                                                            </Typography>
                                                        </Grid>
                                                        <Grid item xs={3}>
                                                            <Typography>
                                                                1A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_consistency_1y))}%<br />
                                                                2A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_consistency_2y))}%<br />
                                                                3A: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_consistency_3y))}%<br />
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