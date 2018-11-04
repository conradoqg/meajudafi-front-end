import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { produce, setAutoFreeze } from 'immer';

setAutoFreeze(false);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
});

const emptyState = {
    config: {
        search: {
            term: ''
        }
    },
    layout: {
        showingSearch: false        
    }
};

class FundSearchView extends React.Component {
    state = emptyState;

    handleSearchChange = (event) => {
        // FIXME: This is slow within ui, it needs to be checked        
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.search.term = value;
        }));
    }

    handleSearchApplyClick = async () => {
        // TODO: Not sure if this is the best way to handle that
        return this.props.onSearchChanged(this.state.config.search);
    }

    handleSearchClearClick = async () => {        
        this.setState(produce(draft => {
            draft.config.search.term = '';            
        }));

        return this.props.onSearchChanged(null);
    }

    render = () => {
        const { classes } = this.props;

        return (
            <div className={classes.filterPaperContent}>
                <Typography variant="title" align="center" gutterBottom>Procurar:</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={12}>
                        <TextField
                            id="standard-full-width"
                            style={{ margin: 8 }}
                            placeholder="Nome do fundo ou CNPJ"
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
        );
    }

}

module.exports = withStyles(styles)(FundSearchView);