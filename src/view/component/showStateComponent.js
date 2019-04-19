import React from 'react';

const ShowStateComponent = (props) => {
    const { type, data, hasData, isNull, isErrored, isEmpty } = props;
    let analisedData = null;
    let content = null;

    if (type !== 'array') analisedData = [data];
    else analisedData = data;

    if (analisedData.some(data => data == null)) content = isNull && isNull();
    else if (analisedData.some(data => typeof (data) == 'string')) content = isErrored && isErrored(data);
    else if (analisedData.some(data => Array.isArray(data) && data.length === 0)) content = isEmpty && isEmpty();
    else content = hasData();

    if (content == null) content = (<React.Fragment></React.Fragment>);

    return content;
};

export default ShowStateComponent;