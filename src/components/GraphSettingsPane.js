import React from 'react';
import { Button, Input } from 'semantic-ui-react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
	RECALCULATE_GRAPH, SEARCH_LINK_BY_LABEL, SEARCH_NODE_BY_LABEL, SET_CAMERA_NODE_INDEX, SET_CAMERA_POS, SET_LINK_LABEL_FILTER,
	SET_NODE_LABEL_FILTER,
} from '../queries/LocalMutations';
import { addLogMessage } from '../utils';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';
import {
	MAX_NODE_INDEX,
	NODE_SEARCH_INDEX, NODES_SEARCH_DATA, SEARCH_LINK_LABEL_FILTER, SEARCH_NODE_LABEL_FILTER,
} from '../queries/LocalQueries';
import Icon from 'semantic-ui-react/dist/commonjs/elements/Icon';

const GraphSettingsPane = ( { getMovedNodes, getLinksNeedingRecalculation, getNodesNeedingRecalculation } ) => {
	const client = useApolloClient();
	const [ runRecalculateGraph ] = useMutation( RECALCULATE_GRAPH );
	const [ runSetNodeLabelFilter ] = useMutation( SET_NODE_LABEL_FILTER );
	const [ runSetLinkLabelFilter ] = useMutation( SET_LINK_LABEL_FILTER );
	const [ runSearchNodeLabel ] = useMutation( SEARCH_NODE_BY_LABEL );
	const [ runSearchLinkLabel ] = useMutation( SEARCH_LINK_BY_LABEL );
	const [ runSetCameraCoords ] = useMutation( SET_CAMERA_POS );
	const [ runSetCameraNodeIndex ] = useMutation( SET_CAMERA_NODE_INDEX );

	const { data: nodeLabelSearchString } = useQuery( SEARCH_NODE_LABEL_FILTER );
	const { data: linkLabelSearchString } = useQuery( SEARCH_LINK_LABEL_FILTER );

	const isButtonDisabled = () => {
		const movedNodes = getMovedNodes();
		const nodesNeedingRecalculation = getNodesNeedingRecalculation();
		const linksNeedingRecalculation = getLinksNeedingRecalculation();
		if ( nodesNeedingRecalculation.length > 0 || linksNeedingRecalculation.length > 0 ) {
			return false;
		}
		return movedNodes.length === 0;
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

	const handleNextNode = ( e ) => {
		try {
			e.stopPropagation();
			const { maxNodeIndex } = client.readQuery( { query: MAX_NODE_INDEX } );
			let { nodeSearchIndex } = client.readQuery( { query: NODE_SEARCH_INDEX } );
			nodeSearchIndex += 1;
			if ( nodeSearchIndex > maxNodeIndex ) {
				nodeSearchIndex = 0;
			}
			runSetCameraNodeIndex( { variables: { index: nodeSearchIndex } } )
				.catch( e => addLogMessage( client, 'Error when running set camera node index: ' + e.message ) );

			setCameraCoords( nodeSearchIndex );
		}
		catch ( e ) {
			addLogMessage( client, 'Error in handleNextNode: ' + e.message );
		}
	};

	const handlePrevNode = ( e ) => {
		try {
			e.stopPropagation();
			const { maxNodeIndex } = client.readQuery( { query: MAX_NODE_INDEX } );
			let { nodeSearchIndex } = client.readQuery( { query: NODE_SEARCH_INDEX } );
			nodeSearchIndex -= 1;
			if ( nodeSearchIndex < 0 ) {
				nodeSearchIndex = maxNodeIndex;
			}
			runSetCameraNodeIndex( { variables: { index: nodeSearchIndex } } )
				.catch( e => addLogMessage( client, 'Error when running set camera node index: ' + e.message ) );

			setCameraCoords( nodeSearchIndex );
		}
		catch ( e ) {
			addLogMessage( client, 'Error in handlePrevNode: ' + e.message );
		}
	};

	const setCameraCoords = ( nodeSearchIndex ) => {
		try {
			// find the node the camera should center
			const { Nodes } = client.readQuery( { query: NODES_SEARCH_DATA } );
			let nodeToCenter = Nodes.find( aNode => aNode.searchIndex === nodeSearchIndex );
			const { x, y } = nodeToCenter;
			runSetCameraCoords( { variables: { x, y } } )
				.catch( e => addLogMessage( client, 'Error when running set camera coords: ' + e.message ) );
		}
		catch ( e ) {
			addLogMessage( client, 'Error when setting camera coords: ' + e.message );
		}
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
				className='graph-settings-pane-margin search-line search-input'
				onChange={ handleNodeSearchChange }
				label='Search Node by Label:'
				placeholder='Search...'
			/>
			<Button className='button-left' icon onClick={ handlePrevNode }>
				<Icon name='long arrow alternate left'/>
			</Button>
			<Button icon onClick={ handleNextNode }>
				<Icon name='long arrow alternate right'/>
			</Button>
			<Input
				value={ linkLabelSearchString.searchLinkLabelFilter }
				className='graph-settings-pane-margin search-line search-input'
				onChange={ handleLinksSearchChange }
				label='Search Link by Label:'
				placeholder='Search...'
			/>
		</div>
	);
};

export default withLocalDataAccess( GraphSettingsPane );