import React from 'react';
import Graph from 'react-graph-vis';
import { setActiveItem } from '../utils';
import GraphManager from '../Graph/GraphManager';

const EditorPane = ( { client, nodeData, linkData, setMakeAppActive } ) => {
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
};

export default EditorPane;
