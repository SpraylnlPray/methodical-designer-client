import React, { useEffect } from 'react';
import Graph from 'react-graph-vis';
import { addLogMessage, setActiveItem } from '../utils';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { EDITOR_NODE_DATA, EDITOR_LINK_DATA, ACTIVE_ITEM, CAMERA_POS, NODE_IDS } from '../queries/LocalQueries';
import options from '../Graph/GraphOptions';
import { ADD_EDITOR_ACTION, CREATE_LOCAL_NODE, MOVE_NODE } from '../queries/LocalMutations';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';
import { createNodeFromClipboard, pasteNodeToClipboard } from '../Graph/NodeUtils';

const { useState } = require( 'react' );

const EditorPane = ( { editingData } ) => {
	const client = useApolloClient();
	const [ network, setNetwork ] = useState( null );

	const [ runAddEditorAction ] = useMutation( ADD_EDITOR_ACTION );

	const { data: nodeData } = useQuery( EDITOR_NODE_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local nodes: ` + error.message ),
	} );
	const { data: cameraPosData } = useQuery( CAMERA_POS, {
		onError: error => addLogMessage( client, 'Failed when getting camera coords: ' + error.message ),
	} );
	const { data: linkData } = useQuery( EDITOR_LINK_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local links: ` + error.message ),
	} );
	const [ moveNode ] = useMutation( MOVE_NODE, {
		onError: error => addLogMessage( client, 'Error when moving node: ' + error.message ),
	} );
	const [ createNode ] = useMutation( CREATE_LOCAL_NODE );

	useEffect( () => {
		const { setCameraPos } = cameraPosData;
		debugger
		if ( setCameraPos.type === 'select' ) {
			const { x, y } = setCameraPos;
			network.moveTo( {
				position: { x, y },
				scale: 1.3,
				animation: {
					duration: 300,
					easingFunction: 'easeInOutQuad',
				},
			} );
		}
		else if ( setCameraPos.type === 'fit' ) {
			const { Nodes } = client.readQuery( { query: NODE_IDS } );
			const IDs = Nodes.map( aNode => aNode.id );
			network.fit( {
				nodes: IDs,
				animation: true,
			} );
		}
		// eslint-disable-next-line
	}, [ cameraPosData ] );

	let graph = {
		nodes: [],
		edges: [],
	};
	const events = {
		select: function handleEditorSelect( event ) {
			const { nodes, edges } = event;
			if ( nodes.length > 0 ) {
				setActiveItem( client, nodes[0], 'node' );
				runAddEditorAction( { variables: { type: 'node', itemID: nodes[0], x: '', y: ''} } )
					.catch( error => addLogMessage( client, 'Error when adding editor select after selecting node: ' + error.message ) );
			}
			else if ( edges.length > 0 ) {
				setActiveItem( client, edges[0], 'link' );
				runAddEditorAction( { variables: { type: 'link', itemID: edges[0], x: '', y: '' } } )
					.catch( error => addLogMessage( client, 'Error when adding editor select after selecting link: ' + error.message ) );
			}
		},
		zoom: function handleZoom( event ) {
			const { pointer } = event;
			runAddEditorAction( { variables: { type: 'zoom', itemID: '', x: pointer.x, y: pointer.y } } )
				.catch( error => addLogMessage( client, 'Error when adding editor action zoom: ' + error.message ) );
		},
		dragStart: function handleDragStart( event ) {
			const { nodes } = event;
			if ( nodes.length > 0 ) {
				setActiveItem( client, nodes[0], 'node' );
				runAddEditorAction( { variables: { type: 'node', itemID: nodes[0], x: '', y: '' } } )
					.catch( error => addLogMessage( client, 'Error when adding editor action drag start: ' + error.message ) );
			}
		},
		dragEnd: function handleDragEnd( event ) {
			const { nodes, pointer } = event;
			if ( nodes.length === 0 ) {
				runAddEditorAction( { variables: { type: 'drag', itemID: '', x: pointer.canvas.x, y: pointer.canvas.y } } )
					.catch( error => addLogMessage( client, 'Error when adding editor action drag start: ' + error.message ) );
			}
			else if ( nodes.length > 0 ) {
				moveNode( { variables: { id: nodes[0], x: pointer.canvas.x, y: pointer.canvas.y } } )
					.catch( error => addLogMessage( client, 'Error when moving node: ' + error.message ) );
			}
		},
		click: function handleEditorClick( event ) {
			const { nodes, edges, pointer } = event;
			if ( nodes.length === 0 && edges.length === 0 ) {
				setActiveItem( client, 'app', 'app' );
				runAddEditorAction( { variables: { type: 'click', itemID: '', x: pointer.canvas.x, y: pointer.canvas.y } } )
					.catch( error => addLogMessage( client, 'Error when adding editor click: ' + error.message ) );
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
	const handleClick = ( e ) => {
		e.stopPropagation();
	};

	const handleKeyDown = ( e ) => {
		const charCode = String.fromCharCode( e.which ).toLowerCase();
		if ( e.ctrlKey ) {
			switch ( charCode ) {
				case 'c':
					const { activeItem } = client.readQuery( { query: ACTIVE_ITEM } );
					if ( activeItem.itemType === 'node' ) {
						try {
							pasteNodeToClipboard( activeItem, client );
						}
						catch ( e ) {
							addLogMessage( client, 'Error in pasteNodeToClipboard: ' + e.message );
						}
					}
					break;
				case 'v':
					navigator.clipboard.readText()
						.then( clipText => {
							try {
								createNodeFromClipboard( editingData, clipText, createNode, client );
							}
							catch ( e ) {
								addLogMessage( client, 'Error in createNodeFromClipboard: ' + e.message );
							}
						} );
					break;
				default:
					break;
			}
		}
	};

	return (
		<div className='bordered editor-pane margin-base' id='editor-pane' onClick={ handleClick } onKeyDown={ handleKeyDown }>
			<Graph
				graph={ graph }
				options={ options }
				events={ events }
				getNetwork={ network => {
					setNetwork( network );
				} }
			/>
		</div>
	);
};

export default withLocalDataAccess( EditorPane );
