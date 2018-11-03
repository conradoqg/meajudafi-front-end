
import Typography from '@material-ui/core/Typography';
import React from 'react';

class About extends React.Component {
    state = null;

    render() {
        const { globalClasses } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Sobre</Typography>
                <Typography variant="subheading">Em breve, aguarde...</Typography>
            </div>
        );
    }
}

module.exports = About;