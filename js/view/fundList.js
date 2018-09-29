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
import Slide from '@material-ui/core/Slide';
import InputLabel from '@material-ui/core/InputLabel';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import Button from '@material-ui/core/Button';

const styles = theme => ({
    filterPaper: {
        padding: theme.spacing.unit * 2,
        textAlign: 'center',
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
        page: 0,
        count: 0,
        rowsPerPage: 5,
        anchorEl: null,
        sort: sortOptions[0],
        showingFilter: false,
        filter: {
            class: []
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
        this.setState({
            showingFilter: !this.state.showingFilter
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
                class: []
            }
        });
        this.setState({
            ...this.state,
            filter: {
                class: []
            },
            count: result.count,
            data: result.data
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
        const fundListObject = await fetch(`http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year?${classFilter}order=${sort}`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });
        // TODO: This doesn't work when no rows are returned
        const CONTENT_RANGE_REGEX = /(?<start>\d+)-(?<finish>\d+)\/(?<count>\d+)/gm;
        const contentRange = fundListObject.headers.get('Content-Range');
        const contentRangeFormatted = CONTENT_RANGE_REGEX.exec(contentRange);

        return {
            range,
            count: parseInt(contentRangeFormatted.groups.count),
            data: await fundListObject.json()
        };
    }

    async componentDidMount() {
        const result = await this.getData(this.state);
        this.setState({
            count: result.count,
            data: result.data
        });
    }

    render() {
        const { classes } = this.props;
        const { anchorEl } = this.state;
        const open = Boolean(anchorEl);

        return (
            <div>
                <div className={classes.appBarSpacer} />
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
                        {this.state.data.map((fund, index) => (
                            <ExpansionPanel key={index}>
                                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                    <Grid container spacing={8}>
                                        <Grid item xs={8}>
                                            <Typography>{fund.icf_denom_social}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Grid container spacing={8}>
                                                <Grid item xs={3}>
                                                    <Typography>Performance</Typography>
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
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_1y))}%<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_2y))}%<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_3y))}%
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography>
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_1y))}%<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_2y))}%<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_3y))}%<br />
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography>
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_1y))}<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_2y))}<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_3y))}<br />
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography>
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_consistency_1y))}%<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_consistency_2y))}%<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_consistency_3y))}%<br />
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </ExpansionPanelSummary>
                                <Divider />
                                <ExpansionPanelDetails className={classes.details}>
                                    In Development
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
                    <Slide direction="left" in={this.state.showingFilter} mountOnEnter unmountOnExit>
                        <Grid item xs={4}>
                            <Paper elevation={1} square={true} className={classes.filterPaper}>
                                <Typography variant="title" className={classes.filterPaper}>Filtros:</Typography>
                                <Grid container spacing={16}>
                                    <Grid item xs={12} className={classes.filterPaper}>
                                        <InputLabel htmlFor="select-multiple-checkbox">Classe</InputLabel>
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
                                    <Grid item xs={6} className={classes.filterPaper}>
                                        <Button variant="contained" color="primary" onClick={this.handleFilterApplyClick} >Aplicar</Button>
                                    </Grid>
                                    <Grid item xs={6} className={classes.filterPaper}>
                                        <Button variant="contained" color="secondary" onClick={this.handleFilterClearClick} >Limpar</Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Slide>
                </Grid>
            </div >
        );
    }
}

module.exports = withStyles(styles)(FundListView);