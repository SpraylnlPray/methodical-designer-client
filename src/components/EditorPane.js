import React from 'react';
import Graph from 'react-graph-vis';
import { addLogMessage, setActiveItem } from '../utils';
import { useApolloClient, useQuery } from '@apollo/client';
import { EDITOR_NODE_DATA, EDITOR_LINK_DATA } from '../queries/LocalQueries';


const EditorPane = ( { graphManager } ) => {
	const client = useApolloClient();

	const { data: nodeData } = useQuery( EDITOR_NODE_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local nodes: ${ error }` ),
	} );
	const { data: linkData } = useQuery( EDITOR_LINK_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local links: ${ error }` ),
	} );

	if ( nodeData && linkData ) {
		graphManager.nodes = nodeData.Nodes;
		graphManager.links = linkData.Links;
		const testNode = {
			x: 0,
			y: 0,
			label: 'testestestestest',
		};

		const graph = {
			nodes: graphManager.nodeDisplayData,
			// nodes: graphManager.nodeDisplayData.concat( testNode ),
			edges: graphManager.linkDisplayData,
		};
		const options = graphManager.graphOptions;
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
				setActiveItem( client, nodes[0], 'node' );
			},
			click: function( event ) {
				const { nodes, edges } = event;
				if ( nodes.length === 0 && edges.length === 0 ) {
					setActiveItem( client, 'app', 'app' );
				}
			},
		};

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
	}
};

export default EditorPane;
