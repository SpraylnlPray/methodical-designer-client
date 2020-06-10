import React from 'react';
import Graph from 'react-graph-vis';
import { addLogMessage, setActiveItem } from '../utils';
import { useApolloClient, useQuery } from '@apollo/client';
import { EDITOR_NODE_DATA, EDITOR_LINK_DATA } from '../queries/LocalQueries';
import options from '../Graph/GraphManager';

const EditorPane = () => {
	const client = useApolloClient();

	const { data: nodeData } = useQuery( EDITOR_NODE_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local nodes: ` + error.message ),
	} );
	const { data: linkData } = useQuery( EDITOR_LINK_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local links: ` + error.message ),
	} );

	let graph = {
		nodes: [],
		edges: [],
	};
	const events = {
		select: function( event ) {
			const { nodes, edges } = event;
			if ( nodes.length > 0 ) {
				setActiveItem( client, nodes[0], 'node' );
			}
			else if ( edges.length > 0 ) {
				setActiveItem( client, edges[0], 'link' );
			}
		},
		dragStart: function( event ) {
			const { nodes } = event;
			if ( nodes.length > 0 ) {
				setActiveItem( client, nodes[0], 'node' );
			}
		},
		click: function( event ) {
			const { nodes, edges } = event;
			if ( nodes.length === 0 && edges.length === 0 ) {
				setActiveItem( client, 'app', 'app' );
			}
		},
	};

	if ( nodeData && linkData ) {
		const graphNodes = nodeData.Nodes.filter(aNode => !aNode.deleted);
		const graphLinks = linkData.Links.filter(aLink => !aLink.deleted);

		graph = {
			nodes: graphNodes,
			edges: graphLinks,
		};
	}

	// stopping events in the events object above is not possible
	// so we handle the logic there, and stop the propagation here before it can get to the app level
	function handleClick( e ) {
		e.stopPropagation();
	}

	return (
		<div className='bordered editor-pane margin-base' onClick={ handleClick }>
			<Graph
				graph={ graph }
				options={ options }
				events={ events }
			/>
		</div>
	);
};

export default EditorPane;
