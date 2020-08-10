import React from 'react';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';
import ShowStateComponent from './showStateComponent';
import Plotly from '../../vendor/plotly';
import createPlotlyComponent from 'react-plotly.js/factory';

const Plot = createPlotlyComponent(Plotly);

function DataHistoryChartComponent({ data, onInitialized, onUpdate }) {

    return (
        <ShowStateComponent
            data={data}
            hasData={() => (
                <Plot
                    data={data.data}
                    layout={data.layout}
                    frames={data.frames}
                    config={data.config}
                    onInitialized={onInitialized}
                    onUpdate={onUpdate}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                />
            )}
            isNull={() => (<Skeleton height={300} />)}
            isErrored={() => (<Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography>)}
        />
    );
}

export default DataHistoryChartComponent;