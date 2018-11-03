
import Typography from '@material-ui/core/Typography';
import React from 'react';

class FundComparisonView extends React.Component {
    state = null;

    render() {
        const { globalClasses } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Comparação de Fundos</Typography>                
                <Typography variant="subheading">Em breve, aguarde...</Typography>
            </div>
        );
    }
}

module.exports = FundComparisonView;