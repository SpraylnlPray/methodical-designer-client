import React from 'react';
import '../css/GraphSettings.css';
import { Button } from 'semantic-ui-react';
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
	const [ runSetCameraPos ] = useMutation( SET_CAMERA_POS );
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

	const handleNodeSearchChange = ( e ) => {
		const { value } = e.target;
		e.stopPropagation();
		e.preventDefault();

		runSetNodeLabelFilter( { variables: { string: value } } )
			.then( ( { data } ) => runSearchNodeLabel( { variables: { searchString: data.setNodeLabelFilter } } )
				.catch( e => addLogMessage( client, 'Error when running search node label: ' + e.message ) ) )
			.catch( e => addLogMessage( client, 'Error when running set node label filter: ' + e.message ) );
	};

	const handleLinkSearchChange = ( e ) => {
		const { value } = e.target;
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
			let nodeToCenter = Nodes.find( aNode => aNode.searchIndex === nodeSearchIndex )
			if ( nodeToCenter ) {
				const { x, y } = nodeToCenter;
				runSetCameraPos( { variables: { x, y } } )
					.catch( e => addLogMessage( client, 'Error when running set camera coords: ' + e.message ) );
			}
		}
		catch ( e ) {
			addLogMessage( client, 'Error when setting camera coords: ' + e.message );
		}
	};

	// const handleLog = ( e ) => {
	// 	e.stopPropagation();
	// 	const width = window.innerWidth;
	// 	const height = window.innerHeight;
	// 	addLogMessage( client, 'inner width: ' + width + ' inner height: ' + height );
	// };

	const handleFit = ( e ) => {
		e.stopPropagation();
		let variables = { x: 0, y: 0, type: 'fit' }
		runSetCameraPos( { variables } )
			.then( () => runSetCameraPos( { variables: { ...variables, type: '' } } ) )
			.catch( e => addLogMessage( client, 'Error when setting camera position in handleFit: ' + e.message ) );
	}

	return (
		<div className='graph-settings-pane'>
			<Button
				className='graph-settings-pane-margin calculate-button settings-button'
				disabled={isButtonDisabled()}
				color='blue'
				onClick={handleClick}>
				Re-calculate Graph
			</Button>
			<Button
				className='graph-settings-pane-margin settings-button fit-button'
				color='blue'
				onClick={handleFit}>
				Zoom Out
			</Button>
			<div className='search-node-label search'>
				<label htmlFor="search-node-label" className='search-label'>
					<div className='label-string'>Search Nodes by Label:</div>
				</label>
				<input
					type='text'
					id="search-node-label"
					className='search-input'
					placeholder='Search...'
					onChange={handleNodeSearchChange}
					value={nodeLabelSearchString.searchNodeLabelFilter}
				/>
				<Button className='button-left' icon onClick={handlePrevNode}>
					<Icon name='long arrow alternate left' />
				</Button>
				<Button className='button-right' icon onClick={handleNextNode}>
					<Icon name='long arrow alternate right' />
				</Button>
			</div>
			<div className='search-link-label search'>
				<label htmlFor="search-link-label" className='search-label'>
					<div className='label-string'>Filter Links by Label:</div>
				</label>
				<input
					type='text'
					id="search-link-label"
					className='search-input'
					placeholder='Search...'
					onChange={handleLinkSearchChange}
					value={linkLabelSearchString.searchLinkLabelFilter}
				/>
			</div>
		</div>
	);
};

export default withLocalDataAccess( GraphSettingsPane );