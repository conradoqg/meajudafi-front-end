
import Typography from '@material-ui/core/Typography';
import React from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import lightGreen from '@material-ui/core/colors/lightGreen';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';
import { produce, setAutoFreeze } from 'immer';
import allKeys from 'promise-results/allKeys';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly';
import * as d3Format from 'd3-format';
import ptBR from 'd3-format/locale/pt-BR.json';

const Plot = createPlotlyComponent(Plotly);
d3Format.formatDefaultLocale(ptBR);

import API from '../api';
import { chooseState } from '../util';

setAutoFreeze(false);

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    paper: {
        padding: theme.spacing.unit * 2,
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    optionsBar: {
        padding: theme.spacing.unit * 2
    },
    indicatorValuePositive: {
        color: lightGreen[500]
    },
    indicatorValueBlue: {
        color: blue[500]
    },
    indicatorValueNegative: {
        color: red[500]
    },
    select: {
        margin: theme.spacing.unit
    },
    cropText: {
        maxWidth: '20em',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
    }
});

const emptyState = {
    data: {
        fundIndicators: null,
        economyIndicators: null,
    },
    config: {
        range: '1y'
    }
};

class IndicatorsView extends React.Component {
    state = emptyState;

    handleConfigRangeChange = event => {
        const nextState = produce(this.state, draft => {
            draft.config[event.target.name] = event.target.value;
        });
        this.setState(nextState);
        this.updateChart(nextState.config);
    }

    handleChartInitialized = async (figure) => {
        this.setState(produce(draft => {
            draft.data.economyIndicators = figure;
        }));
    }

    handleChartUpdate = async (figure) => {
        this.setState(produce(draft => {
            draft.data.economyIndicators = figure;
        }));
    }

    updateChart = async (config) => {
        try {
            const data = await this.getEconomyIndicators(config);

            this.setState(produce(draft => {
                draft.data.economyIndicators = data;
            }));
        } catch (ex) {
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.economyIndicators = ex.message;
            }));
        }
    }

    async componentDidMount() {
        try {
            const { fundIndicators, economyIndicators } = await allKeys({
                fundIndicators: this.getFundIndicators(this.state.config),
                economyIndicators: this.getEconomyIndicators(this.state.config)
            });

            this.setState(produce(draft => {
                draft.data.fundIndicators = fundIndicators;
                draft.data.economyIndicators = economyIndicators;
            }));
        } catch (ex) {
            console.error(ex.message);
            this.setState(produce(draft => {
                draft.data.fundIndicators = ex.message;
            }));
        }
    }

    async getEconomyIndicators(config) {

        let from = null;
        let range = null;

        switch (config.range) {
            case 'mtd':
                from = new Date((new Date()).getFullYear(), (new Date()).getMonth(), 1);
                break;
            case 'ytd':
                from = new Date((new Date()).getFullYear(), 0, 1);
                break;
            case '1m':
                range = 21;
                break;
            case '3m':
                range = 63;
                break;
            case '6m':
                range = 126;
                break;
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

        const economyIndicators = await API.getEconomyIndicators(range == null ? from : range);

        return {
            data: [
                {
                    x: economyIndicators.date,
                    y: economyIndicators.cdi,
                    type: 'scatter',
                    name: 'CDI'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.selic,
                    type: 'scatter',
                    name: 'Selic',
                    yaxis: 'y2'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.bovespa,
                    type: 'scatter',
                    name: 'Bovespa',
                    yaxis: 'y3'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.igpm,
                    type: 'scatter',
                    name: 'IGPM',
                    yaxis: 'y4'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.igpdi,
                    type: 'scatter',
                    name: 'IGPDI',
                    yaxis: 'y5'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.ipca,
                    type: 'scatter',
                    name: 'IPCA',
                    yaxis: 'y6'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.dolar,
                    type: 'scatter',
                    name: 'Dólar',
                    yaxis: 'y7'
                },
                {
                    x: economyIndicators.date,
                    y: economyIndicators.euro,
                    type: 'scatter',
                    name: 'Euro',
                    yaxis: 'y8'
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
                    domain: [0.05, 0.80]
                },
                yaxis: {
                    title: 'CDI',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                },
                yaxis2: {
                    title: 'Selic',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'left',
                    fixedrange: true,
                    position: 0
                },
                yaxis3: {
                    title: 'Bovespa',
                    anchor: 'x',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true
                },
                yaxis4: {
                    title: 'IGPM',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.84
                },
                yaxis5: {
                    title: 'IGPDI',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.88
                },
                yaxis6: {
                    title: 'IPCA',
                    type: 'linear',
                    tickformat: ',.0%',
                    hoverformat: ',.2%',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    fixedrange: true,
                    position: 0.92
                },
                yaxis7: {
                    title: 'Dólar',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    tickprefix: 'R$ ',
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
                    fixedrange: true,
                    position: 0.96
                },
                yaxis8: {
                    title: 'Euro',
                    anchor: 'free',
                    overlaying: 'y',
                    side: 'right',
                    tickprefix: 'R$ ',
                    tickformat: ',.2f',
                    hoverformat: ',.2f',
                    fixedrange: true,
                    position: 1
                }
            }
        };
    }

    async getFundIndicators() {
        const result = await API.getFundIndicators();

        const ranges = ['mtd', 'ytd', '1m', '3m', '6m', '1y', '2y', '3y'];

        const fields = [
            'investment_return',
            'networth',
            'quotaholders',
            'risk'
        ];

        const fundIndicators = {};
        const f_short_name = (field, range, side) => `f_short_name_${field}_${range}_${side}`;
        const irm = (field, range, side) => `irm_${field}_${range}_${side}`;

        ranges.map(range => {
            result.map(row => {
                fields.map(field => {
                    if (typeof (fundIndicators[range]) != 'object') fundIndicators[range] = {};
                    if (typeof (fundIndicators[range][field]) != 'object') fundIndicators[range][field] = {};
                    if (!Array.isArray(fundIndicators[range][field]['top'])) fundIndicators[range][field]['top'] = [];
                    if (!Array.isArray(fundIndicators[range][field]['bottom'])) fundIndicators[range][field]['bottom'] = [];

                    fundIndicators[range][field]['top'].push({
                        name: row[f_short_name(field, range, 'top')],
                        value: (row[irm(field, range, 'top')] * 100).toFixed(2)
                    });
                    fundIndicators[range][field]['bottom'].unshift({
                        name: row[f_short_name(field, range, 'bottom')],
                        value: (row[irm(field, range, 'bottom')] * 100).toFixed(2)
                    });
                });
            });
        });

        return fundIndicators;
    }

    render() {
        const { globalClasses, classes } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="display1" gutterBottom>Indicadores</Typography>
                    </Grid>
                    <Grid container justify="flex-end">
                        <Grid item>
                            <Select
                                value={this.state.config.range}
                                onChange={this.handleConfigRangeChange}
                                className={classes.select}
                                inputProps={{
                                    name: 'range',
                                    id: 'range',
                                }}
                            >
                                <MenuItem value={'mtd'}>Nesse mês</MenuItem>
                                <MenuItem value={'ytd'}>Nesse ano</MenuItem>
                                <MenuItem value={'1m'}>1 mês</MenuItem>
                                <MenuItem value={'3m'}>3 meses</MenuItem>
                                <MenuItem value={'6m'}>6 meses</MenuItem>
                                <MenuItem value={'1y'}>1 ano</MenuItem>
                                <MenuItem value={'2y'}>2 anos</MenuItem>
                                <MenuItem value={'3y'}>3 anos</MenuItem>
                            </Select>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Econômicos</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={12}>
                        <Paper className={classes.paper} elevation={1} square={true}>
                            <EconomyHistoryChart
                                fund={this.state.data.economyIndicators}
                                onInitialized={(figure) => this.handleChartInitialized(figure)}
                                onUpdate={(figure) => this.handleChartUpdate(figure)}
                            />
                        </Paper>
                    </Grid>
                </Grid>
                <br />
                <Grid container wrap="nowrap">
                    <Grid container alignItems="center" justify="flex-start">
                        <Typography variant="headline" gutterBottom>Fundos de Investimento</Typography>
                    </Grid>
                </Grid>
                <Grid container spacing={16}>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Desempenho" field="investment_return" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} />
                    </Grid>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Patrimônio" field="networth" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} />
                    </Grid>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Cotistas" field="quotaholders" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} />
                    </Grid>
                    <Grid item xs={3}>
                        <IndicatorPaper title="Risco" field="risk" range={this.state.config.range} data={this.state.data.fundIndicators} classes={classes} inverted />
                    </Grid>
                </Grid>
            </div >
        );
    }
}

const IndicatorPaper = (props) => {
    const { classes, range, title, field, data, inverted = false } = props;

    const getClassForValue = value => {
        if (value == 0)
            return classes.indicatorValueBlue;
        else if (value > 0)
            return inverted ? classes.indicatorValueNegative : classes.indicatorValuePositive;
        else if (value < 0)
            return inverted ? classes.indicatorValuePositive : classes.indicatorValueNegative;
    };

    return (
        <div>
            <Paper elevation={1} square={true}>
                <Grid container wrap="nowrap" className={classes.optionsBar}>
                    <Typography component="h2" variant="headline">{title}</Typography>
                </Grid>
            </Paper>
            <Paper className={classes.paper} elevation={1} square={true}>
                {
                    chooseState(data,
                        () => {
                            const positive = data[range][field]['top'].map((indicator, index) => (
                                <div key={index}>
                                    <ListItem divider>
                                        <ListItemText disableTypography>
                                            <Typography component="span" variant="body1" className={classes.cropText}>{indicator.name}</Typography>
                                        </ListItemText>
                                        <ListItemSecondaryAction>
                                            <Typography component="span" variant="body1" className={getClassForValue(indicator.value)}>{indicator.value}%</Typography>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </div>
                            ));
                            const divider = (< ListItem divider >
                                <ListItemText disableTypography={true}>
                                    <Typography component="span" variant="body1" align="center">...</Typography>
                                </ListItemText>
                            </ListItem>);
                            const negative = data[range][field]['bottom'].map((indicator, index) => (
                                <div key={index}>
                                    <ListItem divider>
                                        <ListItemText disableTypography>
                                            <Typography component="span" variant="body1" className={classes.cropText}>{indicator.name}</Typography>
                                        </ListItemText>
                                        <ListItemSecondaryAction>
                                            <Typography component="span" variant="body1" className={getClassForValue(indicator.value)}>{indicator.value}%</Typography>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </div>
                            ));
                            return (<List>
                                {positive}
                                {divider}
                                {negative}
                            </List>);
                        },
                        () => (<Typography variant="subheading" align="center"><CircularProgress className={classes.progress} /></Typography>),
                        () => (<Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>),
                        () => (<Typography variant="subheading" align="center">Sem dados à exibir</Typography>)
                    )
                }
            </Paper>
        </div>);
};

const EconomyHistoryChart = (props) => {
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

module.exports = withStyles(styles)(IndicatorsView);