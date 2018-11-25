import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import { produce, setAutoFreeze } from 'immer';

setAutoFreeze(false);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
    }
});

const emptyState = {
    config: {
        range: 'all',
        sharpeRange: '1y',
        consistencyRange: '1y',
        performanceValue: 'absolute',
        riskValue: 'absolute',
        sharpeValue: 'absolute',
        consistencyValue: 'absolute',
        networthValue: 'absolute',
        quotaholdersValue: 'absolute'
    }
};

class FundChartConfigView extends React.Component {
    state = emptyState;

    handleValueChange = field => event => {
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config[field] = value;
        }));
    }

    handleFilterApplyClick = async () => {        
        return this.props.onChartConfigChanged(this.state.config);
    }

    handleFilterClearClick = async () => {        
        this.setState(produce(draft => {
            draft.config = emptyState.config;
        }));

        return this.props.onChartConfigChanged(null);
    }

    render = () => {
        const { classes } = this.props;

        return (
            <div className={classes.filterPaperContent}>
                <Typography variant="title" align="center" gutterBottom>Configurações dos Indicadores:</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Período</FormLabel>
                            <RadioGroup
                                aria-label="Período"
                                name="range"
                                className={classes.group}
                                value={this.state.config.range}
                                onChange={this.handleValueChange('range')}
                            >
                                <FormControlLabel value="1y" control={<Radio />} label="1 ano" />
                                <FormControlLabel value="2y" control={<Radio />} label="2 anos" />
                                <FormControlLabel value="3y" control={<Radio />} label="3 anos" />
                                <FormControlLabel value="all" control={<Radio />} label="Desde o início" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Sharpe Período</FormLabel>
                            <RadioGroup
                                aria-label="Sharpe Período"
                                name="sharpeRange"
                                className={classes.group}
                                value={this.state.config.sharpeRange}
                                onChange={this.handleValueChange('sharpeRange')}
                            >
                                <FormControlLabel value="1y" control={<Radio />} label="1 ano" />
                                <FormControlLabel value="2y" control={<Radio />} label="2 anos" />
                                <FormControlLabel value="3y" control={<Radio />} label="3 anos" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Consistência Período</FormLabel>
                            <RadioGroup
                                aria-label="Consistência Período"
                                name="consistencyRange"
                                className={classes.group}
                                value={this.state.config.consistencyRange}
                                onChange={this.handleValueChange('consistencyRange')}
                            >
                                <FormControlLabel value="1y" control={<Radio />} label="1 ano" />
                                <FormControlLabel value="2y" control={<Radio />} label="2 anos" />
                                <FormControlLabel value="3y" control={<Radio />} label="3 anos" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Desempenho</FormLabel>
                            <RadioGroup
                                aria-label="Desempenho"
                                name="performance"
                                className={classes.group}
                                value={this.state.config.performanceValue}
                                onChange={this.handleValueChange('performanceValue')}
                            >
                                <FormControlLabel value="absolute" control={<Radio />} label="Absoluto" />
                                <FormControlLabel value="relative" control={<Radio />} label="Relativo" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Risco</FormLabel>
                            <RadioGroup
                                aria-label="Risco"
                                name="risk"
                                className={classes.group}
                                value={this.state.config.riskValue}
                                onChange={this.handleValueChange('riskValue')}
                            >
                                <FormControlLabel value="absolute" control={<Radio />} label="Absoluto" />
                                <FormControlLabel value="relative" control={<Radio />} label="Relativo" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Sharpe</FormLabel>
                            <RadioGroup
                                aria-label="Sharpe"
                                name="sharpe"
                                className={classes.group}
                                value={this.state.config.sharpeValue}
                                onChange={this.handleValueChange('sharpeValue')}
                            >
                                <FormControlLabel value="absolute" control={<Radio />} label="Absoluto" />
                                <FormControlLabel value="relative" control={<Radio />} label="Relativo" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Consistência</FormLabel>
                            <RadioGroup
                                aria-label="Consistência"
                                name="consistency"
                                className={classes.group}
                                value={this.state.config.consistencyValue}
                                onChange={this.handleValueChange('consistencyValue')}
                            >
                                <FormControlLabel value="absolute" control={<Radio />} label="Absoluto" />
                                <FormControlLabel value="relative" control={<Radio />} label="Relativo" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Patrimônio</FormLabel>
                            <RadioGroup
                                aria-label="Patrimônio"
                                name="networth"
                                className={classes.group}
                                value={this.state.config.networthValue}
                                onChange={this.handleValueChange('networthValue')}
                            >
                                <FormControlLabel value="absolute" control={<Radio />} label="Absoluto" />
                                <FormControlLabel value="relative" control={<Radio />} label="Relativo" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={4}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Cotistas</FormLabel>
                            <RadioGroup
                                aria-label="Cotistas"
                                name="quotaholders"
                                className={classes.group}
                                value={this.state.config.quotaholdersValue}
                                onChange={this.handleValueChange('quotaholdersValue')}
                            >
                                <FormControlLabel value="absolute" control={<Radio />} label="Absoluto" />
                                <FormControlLabel value="relative" control={<Radio />} label="Relativo" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" color="primary" onClick={this.handleFilterApplyClick} >Aplicar</Button>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" color="secondary" onClick={this.handleFilterClearClick} >Limpar</Button>
                    </Grid>
                </Grid>
            </div>
        );
    }

}

module.exports = withStyles(styles)(FundChartConfigView);