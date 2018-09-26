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

const styles = theme => ({
    heading: {
        fontSize: theme.typography.pxToRem(11)
    }
});

const formatters = {
    somethingToPercentage: (value) => !isNaN(value) ? (value * 100).toFixed(2) : null,
    somethingToValue: (value) => value != null && !isNaN(value)  ? value.toFixed(2) : null,
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

const ITEM_HEIGHT = 48;

class FundListView extends React.Component {
    state = {
        data: [],
        page: 0,
        count: 0,
        rowsPerPage: 5,
        anchorEl: null,
        sort: sortOptions[0]
    };

    handleChangePage = async (object, page) => {
        const result = await this.getData({
            page,
            rowsPerPage: this.state.rowsPerPage,
            sort: this.state.sort
        });
        this.setState({
            page,
            count: result.count,
            data: result.data
        });
    }

    handleChangeRowsPerPage = async (event) => {
        const result = await this.getData({
            page: this.state.page,
            rowsPerPage: event.target.value,
            sort: this.state.sort
        });
        this.setState({
            rowsPerPage: event.target.value,
            count: result.count,
            data: result.data
        });
    }

    handleClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleClose = () => {
        this.setState({ anchorEl: null });
    };

    handleOrderMenuItemClick = async (event, index) => {
        const result = await this.getData({
            page: this.state.page,
            rowsPerPage: this.state.rowsPerPage,
            sort: sortOptions[index]
        });
        this.setState({
            sort: sortOptions[index],
            anchorEl: null,
            data: result.data
        });
    }

    async getData(options) {
        const range = options.page * options.rowsPerPage + '-' + ((options.page * options.rowsPerPage) + options.rowsPerPage);
        const sort = options.sort.field + '.' + options.sort.order;
        const fundListObject = await fetch('http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year?order=' + sort, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });

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
                <Grid container spacing={24}>
                    <Grid item xs={8}>
                        <Paper elevation='1' square='true'>
                            <Grid
                                container
                                direction="row"
                                justify="flex-end"
                                alignItems="center">
                                <IconButton
                                    aria-label="More"
                                    aria-owns={open ? 'long-menu' : null}
                                    aria-haspopup="true"
                                    onClick={this.handleClick}>
                                    <ReorderIcon />
                                </IconButton>
                                <Menu
                                    id="long-menu"
                                    anchorEl={anchorEl}
                                    open={open}
                                    onClose={this.handleClose}
                                    PaperProps={{
                                        style: {
                                            maxHeight: ITEM_HEIGHT * 4.5,
                                            width: 220,
                                        },
                                    }}>
                                    {sortOptions.map((option, index) => (
                                        <MenuItem key={option.displayName} selected={option.displayName === this.state.sort.displayName} onClick={event => this.handleOrderMenuItemClick(event, index)}>
                                            {option.displayName}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Grid>
                        </Paper>
                        {this.state.data.map((fund, index) => (
                            <ExpansionPanel key={index}>
                                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                    <Grid container spacing={8}>
                                        <Grid item xs={8}>
                                            <Typography className={classes.heading}>{fund.icf_denom_social}</Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Grid container spacing={8}>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>Performance</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>Risco</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>Sharpe</Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>Consistência</Typography>
                                                </Grid>
                                            </Grid>
                                            <Grid container spacing={8}>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_1y))}%<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_2y))}%<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_investment_return_3y))}%
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_1y))}%<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_2y))}%<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToPercentage(fund.iry_risk_3y))}%<br />
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>
                                                        1y: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_1y))}<br />
                                                        2y: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_2y))}<br />
                                                        3y: {formatters.aValueOrTrace(formatters.somethingToValue(fund.iry_sharpe_3y))}<br />
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography className={classes.heading}>
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
                    <Grid item xs={4}>

                    </Grid>
                </Grid>
            </div >
        );
    }
}

module.exports = withStyles(styles)(FundListView);