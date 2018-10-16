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
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Plot from 'react-plotly.js';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    }
});

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

class FundListView extends React.Component {
    state = {
        data: [],
        fundData: {},
        page: 0,
        count: 0,
        rowsPerPage: 5,
        anchorEl: null,
        sort: sortOptions[0],
        showingFilter: false,
        filter: {
            class: [],
            iry_investment_return_1y: {
                min: -2,
                max: 2
            }
        },
        filterOptions: {
            iry_investment_return_1y: [2, -2]
        }
    };

    handleChangePage = async (object, page) => {
        const result = await this.getData({
            ...this.state,
            page
        });
        this.setState({
            page,
            count: result.count,
            data: result.data
        });
    }

    handleChangeRowsPerPage = async (event) => {
        const result = await this.getData({
            ...this.state,
            rowsPerPage: event.target.value,
        });
        this.setState({
            rowsPerPage: event.target.value,
            count: result.count,
            data: result.data
        });
    }

    handleSortClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleSortClose = () => {
        this.setState({ anchorEl: null });
    };

    handleSortMenuItemClick = async (event, index) => {
        const result = await this.getData({
            ...this.state,
            sort: sortOptions[index]
        });
        this.setState({
            sort: sortOptions[index],
            anchorEl: null,
            count: result.count,
            data: result.data
        });
    }

    handleFilterClick = () => {
        this.setState((state) => {
            return { showingFilter: !state.showingFilter };
        });

    }

    handleFilterClassChange = event => {
        this.setState({
            filter: {
                ...this.state.filter,
                class: event.target.value
            }
        });
    }

    handleFilterApplyClick = async () => {
        const result = await this.getData({
            ...this.state
        });
        this.setState({
            ...this.state,
            count: result.count,
            data: result.data
        });
    }

    handleFilterClearClick = async () => {
        const result = await this.getData({
            ...this.state,
            filter: {
                ...this.state.filter,
                class: [],
                iry_investment_return_1y: {
                    min: -2,
                    max: 2
                }
            }
        });
        this.setState({
            ...this.state,
            filter: {
                ...this.state.filter,
                class: [],
                iry_investment_return_1y: {
                    min: -2,
                    max: 2
                }
            },
            count: result.count,
            data: result.data
        });
    }

    handleFilter_iry_investment_return_1y_Click = async (range) => {
        this.setState({
            ...this.state,
            filter: {
                ...this.state.filter,
                iry_investment_return_1y: {
                    min: range[0],
                    max: range[1]
                }
            }
        });
    }

    handleChartInitialized = async (fund, figure) => {
        this.setState((state) => {
            return {
                fundData: {
                    ...state.fundData,
                    [fund.icf_cnpj_fundo]: figure
                }
            };
        });
    }

    handleChartUpdate = async (fund, figure) => {
        this.setState((state) => {
            return {
                fundData: {
                    ...state.fundData,
                    [fund.icf_cnpj_fundo]: figure
                }
            };
        });
    }

    handleFundExpansion = async (expanded, fund) => {
        const data = (expanded ? await this.getFundData(fund.icf_cnpj_fundo) : null);

        this.setState((state) => {
            return {
                fundData: {
                    ...state.fundData,
                    [fund.icf_cnpj_fundo]: data
                }
            };
        });
    }

    async getData(options) {
        const range = `${options.page * options.rowsPerPage}-${((options.page * options.rowsPerPage) + options.rowsPerPage)}`;
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
        const fundListObject = await fetch(`http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year?${classFilter}${iry_investment_return_1yFilter}order=${sort}`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });
        // TODO: This doesn't work when zero rows are returned
        const CONTENT_RANGE_REGEX = /(\d+)-(\d+)\/(\d+)/gm;
        const contentRange = fundListObject.headers.get('Content-Range');
        const count = CONTENT_RANGE_REGEX.exec(contentRange)[3];

        return {
            range,
            count: parseInt(count),
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
        const result = await this.getData(this.state);
        const result2 = await this.getDataAgreggation();

        const min = isNaN(result2[0].iry_investment_return_1y_min) || !isFinite(result2[0].iry_investment_return_1y_min) || result2[0].iry_investment_return_1y_min < -2 ? -2 : Math.floor(result2[0].iry_investment_return_1y_min);
        const max = isNaN(result2[0].iry_investment_return_1y_max) || !isFinite(result2[0].iry_investment_return_1y_max) || result2[0].iry_investment_return_1y_max > 2 ? 2 : Math.ceil(result2[0].iry_investment_return_1y_max);

        this.setState({
            count: result.count,
            data: result.data,
            filter: {
                ...this.state.filter,
                iry_investment_return_1y: {
                    min,
                    max
                }
            },
            filterOptions: {
                iry_investment_return_1y: {
                    min,
                    max
                }
            }
        });
    }

    render() {
        const { classes, globalClasses } = this.props;
        const { anchorEl } = this.state;
        const open = Boolean(anchorEl);

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
                                    aria-label="Ordem"
                                    aria-owns={open ? 'long-menu' : null}
                                    aria-haspopup="true"
                                    onClick={this.handleSortClick}>
                                    <ReorderIcon />
                                </IconButton>
                                <Menu
                                    id="long-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={this.handleSortClose}
                                    PaperProps={{
                                        style: {
                                            maxHeight: ITEM_HEIGHT * 4.5,
                                            width: 220,
                                        },
                                    }}>
                                    {sortOptions.map((option, index) => (
                                        <MenuItem key={option.displayName} selected={option.displayName === this.state.sort.displayName} onClick={event => this.handleSortMenuItemClick(event, index)}>
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
                            <Collapse in={this.state.showingFilter} mountOnEnter unmountOnExit>
                                {this.state.showingFilter ?
                                    <div className={classes.filterPaperContent}>
                                        <Typography variant="title" align="center" gutterBottom>Filtros:</Typography>
                                        <Grid container spacing={24}>
                                            <Grid item xs={12}>
                                                <Typography variant="subheading" align="center" gutterBottom>Classe:</Typography>                                            
                                                <Select
                                                    multiple
                                                    value={this.state.filter.class}
                                                    onChange={this.handleFilterClassChange}
                                                    input={<Input id="select-multiple-checkbox" />}
                                                    renderValue={selected => selected.map(item => filterOptions.class.options.find(clazz => clazz.value == item).displayName).join(', ')}
                                                    MenuProps={MenuProps}
                                                    fullWidth>
                                                    {filterOptions.class.options.map(classOption => (
                                                        <MenuItem key={classOption.displayName} value={classOption.value}>
                                                            <Checkbox checked={this.state.filter.class.indexOf(classOption.value) > -1} />
                                                            <ListItemText primary={classOption.displayName} />
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="subheading" align="center" gutterBottom>Desempenho 1A:</Typography>                                            
                                                <Range
                                                    min={this.state.filterOptions.iry_investment_return_1y.min}
                                                    tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                                                    max={this.state.filterOptions.iry_investment_return_1y.max}
                                                    step={Math.abs((this.state.filterOptions.iry_investment_return_1y.max - this.state.filterOptions.iry_investment_return_1y.min) / 50)}
                                                    onChange={this.handleFilter_iry_investment_return_1y_Click}
                                                    value={[this.state.filter.iry_investment_return_1y.min, this.state.filter.iry_investment_return_1y.max]} />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Button variant="contained" color="primary" onClick={this.handleFilterApplyClick} >Aplicar</Button>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Button variant="contained" color="secondary" onClick={this.handleFilterClearClick} >Limpar</Button>
                                            </Grid>
                                        </Grid>
                                    </div> : <div></div>
                                }
                            </Collapse>
                        </Paper>
                        {this.state.data.map((fund, index) => (
                            <ExpansionPanel key={index} expanded={this.state.fundData[fund.icf_cnpj_fundo] ? true : false} onChange={(e, expanded) => this.handleFundExpansion(expanded, fund)}>
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
                                                fund={this.state.fundData[fund.icf_cnpj_fundo]}
                                                onInitialized={(figure) => this.handleChartInitialized(fund, figure)}
                                                onUpdate={(figure) => this.handleChartUpdate(fund, figure)}
                                            />
                                        </Grid>
                                    </Grid>
                                </ExpansionPanelDetails>
                            </ExpansionPanel>
                        ))}
                        <TablePagination
                            component="div"
                            count={this.state.count}
                            rowsPerPage={this.state.rowsPerPage}
                            page={this.state.page}
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
                    </Grid>
                </Grid>
            </div >
        );
    }
}

const FundHistoryChart = (props) => {
    const { fund, handleChartInitialized, handleChartUpdate } = props;

    if (!fund) return <Typography variant="title">Carregando...</Typography>;
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

module.exports = withStyles(styles)(FundListView);