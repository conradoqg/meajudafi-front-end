
import Typography from '@material-ui/core/Typography';
import React from 'react';

class FundListView extends React.Component {
    state = null;

    render() {
        const { classes } = this.props;

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Lista de Fundos</Typography>
            </div>
        );
    }
}

module.exports = FundListView;