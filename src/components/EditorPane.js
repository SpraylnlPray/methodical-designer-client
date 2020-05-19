import React from 'react';
import Graph from 'react-graph-vis';
import { setActiveItem } from '../utils';
import GraphManager from '../Graph/GraphManager';
import { useQuery } from '@apollo/client';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from '../queries/ServerQueries';

const EditorPane = ( { client, setMakeAppActive } ) => {
	console.log( 'rendering editor pane' );
	const { data: nodeData, refetch: nodeRefetch } = useQuery( GET_SERVER_NODES, {
		context: {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		},
		onError: error => console.log( error ),
	} );
	const { data: linkData, refetch: linkRefetch } = useQuery( GET_SERVER_LINKS, {
		context: {
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		},
		onError: error => console.log( error ),
	} );

	if ( nodeData && linkData ) {
		const theManager = new GraphManager( nodeData.Nodes, linkData.Links );
		let nodes = theManager.nodeDisplayData;
		let links = theManager.linkDisplayData;

		const graph = {
			nodes,
			edges: links,
		};
		const options = theManager.graphOptions;

		const events = {
			selectNode: function( event ) {
				let { nodes } = event;
				setMakeAppActive( false );
				setActiveItem( client, nodes[0], 'node' );
			},
			selectEdge: function( event ) {
				let { edges } = event;
				setMakeAppActive( false );
				setActiveItem( client, edges[0], 'link' );
			},
		};

		return (
			<div className='bordered editor-pane margin-base'>
				<Graph
					graph={ graph }
					options={ options }
					events={ events }
				/>
			</div>
		);
	}
	else {
		console.log( 'in else statement' );
		nodeRefetch()
			.catch( err => {
				console.log( err );
			} );
		linkRefetch()
			.catch( err => {
				console.log( err );
			} );

		return (
			<div className='bordered editor-pane margin-base'>
				Loading data
			</div>
		);
	}
};

export default EditorPane;
