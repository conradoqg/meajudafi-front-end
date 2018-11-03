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
import SearchIcon from '@material-ui/icons/Search';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Plot from 'react-plotly.js';
import { produce, setAutoFreeze } from 'immer';
import CircularProgress from '@material-ui/core/CircularProgress';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
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
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const formatters = {
    somethingToPercentage: (value) => !isNaN(value) ? (value * 100).toFixed(2) : null,
    somethingToValue: (value) => value != null && !isNaN(value) ? value.toFixed(2) : null,
    aValueOrTrace: (value) => value == null ? '-' : value
};

const sortOptions = [
    {
        displayName: 'CNPJ',
        field: 'icf_cnpj_fundo',
        order: 'asc'
    },
    {
        displayName: 'Desempenho 1 Ano (Asc)',
        field: 'iry_investment_return_1y',
        order: 'asc'
    },
    {
        displayName: 'Desempenho 1 Ano (Desc)',
        field: 'iry_investment_return_1y',
        order: 'desc'
    }
];

const filterOptions = {
    class: {
        field: 'icf_classe',
        options: [
            {
                displayName: 'Dívida Externa',
                value: 'Fundo da Dívida Externa'
            },
            {
                displayName: 'Renda Fixa',
                value: 'Fundo de Renda Fixa'
            },
            {
                displayName: 'Ações',
                value: 'Fundo de Ações'
            },
            {
                displayName: 'Curto Prazo',
                value: 'Fundo de Curto Prazo'
            },
            {
                displayName: 'Cambial',
                value: 'Fundo Cambial'
            },
            {
                displayName: 'Multimercado',
                value: 'Fundo Multimercado'
            },
            {
                displayName: 'Referenciado',
                value: 'Fundo Referenciado'
            },
            {
                displayName: 'Não Identificado',
                value: null
            }
        ]
    }
};

const emptyState = {
    data: {
        fundList: null,
        fundDetail: {},
        totalRows: null,
        sortOptions: sortOptions,
        filterOptions: filterOptions,
        filterRange: {
            iry_investment_return_1y: [2, -2]
        }
    },
    config: {
        page: 0,
        rowsPerPage: 5,
        sort: sortOptions[0],
        filter: {
            class: [],
            iry_investment_return_1y: {
                min: -2,
                max: 2
            }
        },
        search: {
            term: ''
        }
    },
    layout: {
        anchorEl: null,
        showingFilter: false,
        showingSearch: false
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

        const result = await this.getData(nextState.config);

        this.setState(produce(nextState, draft => {
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
        }));
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

        const result = await this.getData(nextState.config);

        this.setState(produce(nextState, draft => {
            draft.config.rowsPerPage = event.target.value;
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
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

        const result = await this.getData(nextState.config);

        this.setState(produce(nextState, draft => {
            draft.layout.anchorEl = null;
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
        }));
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

    handleFilterClassChange = event => {
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.filter.class = value;
        }));
    }

    handleSearchChange = (event) => {
        // FIXME: This is slow within ui, it needs to be checked        
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.search.term = value;
        }));
    }

    handleSearchApplyClick = async () => {
        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        const result = await this.getData(this.state.config);

        this.setState(produce(draft => {
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
        }));
    }

    handleSearchClearClick = async () => {
        const nextState = produce(this.state, draft => {
            draft.config.search.term = '';
        });

        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        const result = await this.getData(nextState.config);

        this.setState(produce(nextState, draft => {
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
        }));
    }

    handleFilterApplyClick = async () => {
        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        const result = await this.getData(this.state.config);

        this.setState(produce(draft => {
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
        }));
    }

    handleFilterClearClick = async () => {
        const nextState = produce(this.state, draft => {
            draft.config.filter.class = [];
            draft.config.filter.iry_investment_return_1y = {
                min: -2,
                max: 2
            };
        });

        this.setState(produce(draft => {
            draft.data.totalRows = emptyState.data.totalRows;
            draft.data.fundList = emptyState.data.fundList;
        }));

        const result = await this.getData(nextState.config);

        this.setState(produce(nextState, draft => {
            draft.data.totalRows = result.totalRows;
            draft.data.fundList = result.data;
        }));
    }

    handleFilter_iry_investment_return_1y_Click = (range) => {
        this.setState(produce(draft => {
            draft.config.filter.iry_investment_return_1y = {
                min: range[0],
                max: range[1]
            };
        }));
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
        }));

        const data = (expanded ? await this.getFundData(fund.icf_cnpj_fundo) : null);

        this.setState(produce(draft => {
            draft.data.fundDetail[fund.icf_cnpj_fundo] = data;
        }));
    }

    async getData(options) {
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;
        let classFilter = '';
        if (options.filter.class.length > 0) {
            const selectedFilterOptions = options.filter.class.map(selectedFilter => {
                if (selectedFilter == null) return 'icf_classe.is.null';
                else return `icf_classe.eq."${selectedFilter}"`;
            });
            classFilter = `or=(${selectedFilterOptions.join(',')})&`;
        }
        let iry_investment_return_1yFilter = '';
        if (options.filter.iry_investment_return_1y) {
            iry_investment_return_1yFilter = `and=(iry_investment_return_1y.gte.${options.filter.iry_investment_return_1y.min},iry_investment_return_1y.lte.${options.filter.iry_investment_return_1y.max})&`;
        }
        let searchPart = '';
        if (options.search.term != '') {
            // Identify if it's a CNPJ or a fund name
            if (/^\d+$/.test(options.search.term)) {
                searchPart = `and=(icf_cnpj_fundo.ilike.*${options.search.term}*)`;
            } else {
                searchPart = `and=(icf_denom_social.ilike.*${options.search.term}*)`;
            }

        }
        const fundListObject = await fetch(`http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year?${classFilter}${iry_investment_return_1yFilter}${searchPart}order=${sort}`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });

        const CONTENT_RANGE_REGEX = /(\d+)-(\d+)\/(\d+)/gm;
        const contentRange = fundListObject.headers.get('Content-Range');
        const matchResult = CONTENT_RANGE_REGEX.exec(contentRange);
        const totalRows = matchResult && matchResult.length > 3 ? matchResult[3] : 0;

        return {
            range,
            totalRows: parseInt(totalRows),
            data: await fundListObject.json()
        };
    }

    async getFundData(cnpj) {
        const dailyReturn = await fetch(`http://localhost:82/investment_return_daily?cnpj_fundo=eq.${cnpj}&order=dt_comptc`);
        const infCadastral = await fetch(`http://localhost:82/inf_cadastral_fi?cnpj_fundo=eq.${cnpj}`);

        const dailyReturnObject = await dailyReturn.json();
        const infCadastralObject = await infCadastral.json();
        const x = dailyReturnObject.map(item => item.dt_comptc);
        const y_performance = dailyReturnObject.map(item => item.accumulated_investment_return);
        const y_risk = dailyReturnObject.map(item => item.accumulated_risk);
        const y_consistency_1y = dailyReturnObject.map(item => item.consistency_1y);
        const name = infCadastralObject[0].denom_social;

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

    async getDataAgreggation() {
        const fundListObject = await fetch('http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year_max_min');
        return await fundListObject.json();
    }

    async componentDidMount() {
        try {
            const result = await this.getData(this.state.config);
            const result2 = await this.getDataAgreggation();

            const min = isNaN(result2[0].iry_investment_return_1y_min) || !isFinite(result2[0].iry_investment_return_1y_min) || result2[0].iry_investment_return_1y_min < -2 ? -2 : Math.floor(result2[0].iry_investment_return_1y_min);
            const max = isNaN(result2[0].iry_investment_return_1y_max) || !isFinite(result2[0].iry_investment_return_1y_max) || result2[0].iry_investment_return_1y_max > 2 ? 2 : Math.ceil(result2[0].iry_investment_return_1y_max);

            this.setState(produce(draft => {
                draft.data.totalRows = result.totalRows;
                draft.data.fundList = result.data;
                draft.config.filter.iry_investment_return_1y = {
                    min,
                    max
                };
                draft.data.filterRange.iry_investment_return_1y = {
                    min,
                    max
                };
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
                                    PaperProps={{
                                        style: {
                                            maxHeight: ITEM_HEIGHT * 4.5,
                                            width: 220,
                                        },
                                    }}>
                                    {this.state.data.sortOptions.map((option, index) => (
                                        <MenuItem key={option.displayName} selected={option.displayName === this.state.config.sort.displayName} onClick={event => this.handleSortMenuItemClick(event, index)}>
                                            {option.displayName}
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
                                {layout.showingSearch ?
                                    <div className={classes.filterPaperContent}>
                                        <Typography variant="title" align="center" gutterBottom>Procurar:</Typography>
                                        <Grid container spacing={24}>
                                            <Grid item xs={12}>
                                                <TextField
                                                    id="standard-full-width"
                                                    style={{ margin: 8 }}
                                                    placeholder="Nome do fundo"
                                                    value={this.state.config.search.term}
                                                    fullWidth
                                                    margin="normal"
                                                    onChange={this.handleSearchChange}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={6} align="center">
                                                <Button variant="contained" color="primary" onClick={this.handleSearchApplyClick}>Aplicar</Button>
                                            </Grid>
                                            <Grid item xs={6} align="center">
                                                <Button variant="contained" color="secondary" onClick={this.handleSearchClearClick}>Limpar</Button>
                                            </Grid>
                                        </Grid>
                                    </div>
                                    : <div></div>}
                            </Collapse>
                        </Paper>

                        <Paper elevation={1} square={true}>
                            <Collapse in={layout.showingFilter} mountOnEnter unmountOnExit>
                                {layout.showingFilter ?
                                    <div className={classes.filterPaperContent}>
                                        <Typography variant="title" align="center" gutterBottom>Filtros:</Typography>
                                        <Grid container spacing={24}>
                                            <Grid item xs={12}>
                                                <Typography variant="subheading" align="center" gutterBottom>Classe:</Typography>
                                                <Select
                                                    multiple
                                                    value={this.state.config.filter.class}
                                                    onChange={this.handleFilterClassChange}
                                                    input={<Input id="select-multiple-checkbox" />}
                                                    renderValue={selected => selected.map(item => this.state.data.filterOptions.class.options.find(clazz => clazz.value == item).displayName).join(', ')}
                                                    MenuProps={MenuProps}
                                                    fullWidth>
                                                    {this.state.data.filterOptions.class.options.map(classOption => (
                                                        <MenuItem key={classOption.displayName} value={classOption.value}>
                                                            <Checkbox checked={this.state.config.filter.class.indexOf(classOption.value) > -1} />
                                                            <ListItemText primary={classOption.displayName} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="subheading" align="center" gutterBottom>Desempenho 1A:</Typography>
                                                <Range
                                                    tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                                                    min={this.state.data.filterRange.iry_investment_return_1y.min}
                                                    max={this.state.data.filterRange.iry_investment_return_1y.max}
                                                    step={Math.abs((this.state.data.filterRange.iry_investment_return_1y.max - this.state.data.filterRange.iry_investment_return_1y.min) / 50)}
                                                    onChange={this.handleFilter_iry_investment_return_1y_Click}
                                                    value={[this.state.config.filter.iry_investment_return_1y.min, this.state.config.filter.iry_investment_return_1y.max]} />
                                            </Grid>
                                            <Grid item xs={6} align="center">
                                                <Button variant="contained" color="primary" onClick={this.handleFilterApplyClick} >Aplicar</Button>
                                            </Grid>
                                            <Grid item xs={6} align="center">
                                                <Button variant="contained" color="secondary" onClick={this.handleFilterClearClick} >Limpar</Button>
                                            </Grid>
                                        </Grid>
                                    </div> : <div></div>
                                }
                            </Collapse>
                        </Paper>
                        {
                            chooseState(this.state.data.fundList,
                                () => this.state.data.fundList.map((fund, index) => (
                                    <ExpansionPanel key={index} expanded={this.state.data.fundDetail[fund.icf_cnpj_fundo] ? true : false} onChange={(e, expanded) => this.handleFundExpansion(expanded, fund)}>
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

    if (!fund) return <Typography variant="title" align="center">Carregando...</Typography>;
    else {
        return (
            <Plot
                key={fund.name}
                data={fund.data}
                layout={fund.layout}
                onInitialized={handleChartInitialized}
                onUpdate={handleChartUpdate}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
            />);
    }
};

const chooseState = (data, hasData, isNull, isError, isEmpty) => {
    if (data == null) return isNull();
    if (typeof (data) == 'string') return isError(data);
    if (Array.isArray(data) && data.length == 0) return isEmpty();
    return hasData();
};

const sleeper = (ms) => {
    return (x) => {
        return new Promise(resolve => setTimeout(() => resolve(x), ms));
    };
};

module.exports = withStyles(styles)(FundListView);