import React from 'react';
import { Button, Input } from 'semantic-ui-react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
	RECALCULATE_GRAPH, SEARCH_LINK_BY_LABEL, SEARCH_NODE_BY_LABEL, SET_LINK_LABEL_FILTER, SET_NODE_LABEL_FILTER,
} from '../queries/LocalMutations';
import { addLogMessage } from '../utils';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';
import { SEARCH_LINK_LABEL_FILTER, SEARCH_NODE_LABEL_FILTER } from '../queries/LocalQueries';

const GraphSettingsPane = ( { getMovedNodes } ) => {
	const client = useApolloClient();
	const [ runRecalculateGraph ] = useMutation( RECALCULATE_GRAPH );
	const [ runSetNodeLabelFilter ] = useMutation( SET_NODE_LABEL_FILTER );
	const [ runSetLinkLabelFilter ] = useMutation( SET_LINK_LABEL_FILTER );
	const [ runSearchNodeLabel ] = useMutation( SEARCH_NODE_BY_LABEL );
	const [ runSearchLinkLabel ] = useMutation( SEARCH_LINK_BY_LABEL );
	const { data: nodeLabelSearchString } = useQuery( SEARCH_NODE_LABEL_FILTER );
	const { data: linkLabelSearchString } = useQuery( SEARCH_LINK_LABEL_FILTER );

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

	const handleNodeSearchChange = ( e, { value } ) => {
		e.stopPropagation();
		e.preventDefault();
		runSetNodeLabelFilter( { variables: { string: value } } )
			.then( ( { data } ) => runSearchNodeLabel( { variables: { searchString: data.setNodeLabelFilter } } )
				.catch( e => addLogMessage( client, 'Error when running search node label: ' + e.message ) ) )
			.catch( e => addLogMessage( client, 'Error when running set node label filter: ' + e.message ) );
	};

	const handleLinksSearchChange = ( e, { value } ) => {
		e.stopPropagation();
		e.preventDefault();
		runSetLinkLabelFilter( { variables: { string: value } } )
			.then( ( { data } ) => {
				runSearchLinkLabel( { variables: { searchString: data.setLinkLabelFilter } } )
					.catch( e => addLogMessage( client, 'Error when running search link label: ' + e.message ) );
			} )
			.catch( e => addLogMessage( client, 'Error when running set link label filter: ' + e.message ) );
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
			<Input
				value={ linkLabelSearchString.searchLinkLabelFilter }
				className='graph-settings-pane-margin'
				onChange={ handleLinksSearchChange }
				icon='search'
				label='Search Link by Label:'
				placeholder='Search...'
			/>
		</div>
	);
};

export default withLocalDataAccess( GraphSettingsPane );