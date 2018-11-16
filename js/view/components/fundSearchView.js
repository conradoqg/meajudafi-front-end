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

    timeout = null;

    triggerOnSearchChanged = () => {
        return this.props.onSearchChanged(this.state.config.search);
    };

    handleSearchChange = (event) => {
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.search.term = value;
        }));
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(this.triggerOnSearchChanged, 1000);
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            const value = event.target.value;
            this.setState(produce(draft => {
                draft.config.search.term = value;
            }));            
            if (this.timeout) clearTimeout(this.timeout);
            this.triggerOnSearchChanged();
        }
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
                            onKeyPress={this.handleKeyPress}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                </Grid>
            </div>
        );
    }

}

module.exports = withStyles(styles)(FundSearchView);