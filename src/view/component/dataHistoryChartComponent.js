import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import ShowStateComponent from './showStateComponent';
import { Plotly } from '../../util';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

export default (props) => {
    const { fund: data, handleChartInitialized, handleChartUpdate } = props;

    return (
        <ShowStateComponent
            data={data}
            hasData={() => (
                <Plot
                    key={data.name || null}
                    data={data.data}
                    layout={data.layout}
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
            )}
            isNull={() => (<Typography variant="subheading" align="center"><CircularProgress /></Typography>)}
            isErrored={() => (<Typography variant="subheading" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}            
        />);
};