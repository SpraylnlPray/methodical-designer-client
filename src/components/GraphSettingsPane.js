import React from 'react';
import { Button, Input } from 'semantic-ui-react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { RECALCULATE_GRAPH, SEARCH_NODE_BY_LABEL, SET_NODE_LABEL_FILTER } from '../queries/LocalMutations';
import { addLogMessage } from '../utils';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';
import { SEARCH_NODE_LABEL_FILTER } from '../queries/LocalQueries';

const GraphSettingsPane = ( { getMovedNodes } ) => {
	const client = useApolloClient();
	const [ runRecalculateGraph ] = useMutation( RECALCULATE_GRAPH );
	const [ runSetNodeLabelFilter ] = useMutation( SET_NODE_LABEL_FILTER );
	const [ runSearchNodeLabel ] = useMutation( SEARCH_NODE_BY_LABEL );
	const { data: nodeLabelSearchString } = useQuery( SEARCH_NODE_LABEL_FILTER );

	const isButtonDisabled = () => {
		const data = getMovedNodes();
		return data.length === 0;
	};

	const handleNodeSearchChange = ( e, { value } ) => {
		e.stopPropagation();
		e.preventDefault();
		runSetNodeLabelFilter( { variables: { string: value } } )
			.then( ( { data } ) => runSearchNodeLabel( { variables: { searchString: data.setNodeLabelFilter } } ) )
			.catch( e => addLogMessage( client, 'Error when running set node label filter: ' + e.message ) );
	};

	const handleClick = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runRecalculateGraph()
			.catch( err => addLogMessage( client, 'Error when recalculation graph: ' + err.message ) );
	};

	return (
		<div className='margin-base'>
			<Button
				className='graph-settings-pane-margin'
				disabled={ isButtonDisabled() }
				color='blue'
				onClick={ handleClick }>
				Re-calculate Graph
			</Button>
			<Input
				value={ nodeLabelSearchString.searchNodeLabelFilter }
				className='graph-settings-pane-margin'
				onChange={ handleNodeSearchChange }
				icon='search'
				label='Search Node by Label:'
				placeholder='Search...'
			/>
		</div>
	);
};

export default withLocalDataAccess( GraphSettingsPane );