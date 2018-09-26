import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Divider from '@material-ui/core/Divider';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import TablePagination from '@material-ui/core/TablePagination';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';

const styles = theme => ({
    heading: {
        fontSize: theme.typography.pxToRem(11)
    }
});

const formatters = {
    somethingToPercentage: (value) => !isNaN(value) ? (value * 100).toFixed(2) : null,
    somethingToValue: (value) => !isNaN(value) ? value.toFixed(2) : null,
    aValueOrTrace: (value) => value == null ? '-' : value
};

class FundListView extends React.Component {
    state = {
        data: [],
        page: 0,
        count: 0,
        rowsPerPage: 5
    };

    handleChangePage = async (object, page) => {
        const result = await this.getData({
            page,
            rowsPerPage: this.state.rowsPerPage
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
            rowsPerPage: event.target.value
        });
        this.setState({
            rowsPerPage: event.target.value,
            count: result.count,
            data: result.data
        });
    }

    async getData(options) {
        const range = options.page * options.rowsPerPage + '-' + ((options.page * options.rowsPerPage) + options.rowsPerPage);
        const fundListObject = await fetch('http://localhost:82/inf_cadastral_fi_with_xpi_and_iryf_of_last_year', {
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

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Lista de Fundos</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={8}>
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