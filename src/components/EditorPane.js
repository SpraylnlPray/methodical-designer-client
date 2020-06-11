import React from 'react';
import Graph from 'react-graph-vis';
import { addLogMessage, setActiveItem, setLastEditorAction } from '../utils';
import { useApolloClient, useQuery } from '@apollo/client';
import { EDITOR_NODE_DATA, EDITOR_LINK_DATA } from '../queries/LocalQueries';
import options from '../Graph/GraphOptions';

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
		select: function handleEditorSelect( event ) {
			const { nodes, edges } = event;
			if ( nodes.length > 0 ) {
				setActiveItem( client, nodes[0], 'node' );
			}
			else if ( edges.length > 0 ) {
				setActiveItem( client, edges[0], 'link' );
			}
		},
		zoom: function handleZoom( event ) {
			const { pointer } = event;
			setLastEditorAction( client, 'zoom', pointer.x, pointer.y );
		},
		dragStart: function handleDragStart( event ) {
			const { nodes } = event;
			if ( nodes.length > 0 ) {
				setActiveItem( client, nodes[0], 'node' );
			}
		},
		dragEnd: function handleDragEnd( event ) {
			const { nodes, pointer } = event;
			if ( nodes.length === 0 ) {
				setLastEditorAction( client, 'drag', pointer.canvas.x, pointer.canvas.y );
			}
		},
		click: function handleEditorClick( event ) {
			const { nodes, edges, pointer } = event;
			if ( nodes.length === 0 && edges.length === 0 ) {
				setActiveItem( client, 'app', 'app' );
				setLastEditorAction( client, 'click', pointer.canvas.x, pointer.canvas.y );
			}
		},
	};

	if ( nodeData && linkData ) {
		const graphNodes = nodeData.Nodes.filter( aNode => !aNode.deleted );
		const graphLinks = linkData.Links.filter( aLink => !aLink.deleted );

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
