import React from 'react';
import { Button } from 'semantic-ui-react';
import { useApolloClient, useMutation } from '@apollo/client';
import { RECALCULATE_GRAPH } from '../queries/LocalMutations';
import { addLogMessage } from '../utils';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';

const GraphSettingsPane = ( { getMovedNodes } ) => {
	const client = useApolloClient();
	const [ runRecalculateGraph ] = useMutation( RECALCULATE_GRAPH );

	const isButtonDisabled = () => {
		const data = getMovedNodes();
		return data.length === 0;
	};

	const handleClick = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runRecalculateGraph()
			.catch( err => addLogMessage( client, 'Error when recalculation graph: ' + err.message ) );
	};

	return (
		<div className='margin-base'>
			<Button disabled={ isButtonDisabled() } color='blue' onClick={ handleClick }>Re-calculate Graph</Button>
		</div>
	);
};

export default withLocalDataAccess( GraphSettingsPane );