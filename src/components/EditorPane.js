import React from 'react';
import Graph from 'react-graph-vis';
import { addLogMessage, deepCopy, setActiveItem, setLastEditorAction } from '../utils';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import { EDITOR_NODE_DATA, EDITOR_LINK_DATA, ACTIVE_ITEM, NODES_BASE_DATA } from '../queries/LocalQueries';
import options from '../Graph/GraphOptions';
import { CREATE_LOCAL_NODE, MOVE_NODE } from '../queries/LocalMutations';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';

const EditorPane = ( { editingData } ) => {
	const client = useApolloClient();

	const { data: nodeData } = useQuery( EDITOR_NODE_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local nodes: ` + error.message ),
	} );
	const { data: linkData } = useQuery( EDITOR_LINK_DATA, {
		onError: error => addLogMessage( client, `Failed when getting local links: ` + error.message ),
	} );
	const [ moveNode ] = useMutation( MOVE_NODE, {
		onError: error => addLogMessage( client, 'Error when moving node: ' + error.message ),
	} );
	const [ createNode ] = useMutation( CREATE_LOCAL_NODE );

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
			else if ( nodes.length > 0 ) {
				moveNode( { variables: { id: nodes[0], x: pointer.canvas.x, y: pointer.canvas.y } } )
					.catch( error => addLogMessage( client, 'Error when moving node: ' + error.message ) );
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
	const handleClick = ( e ) => {
		e.stopPropagation();
	};

	// listen to ctrl + c
	// get active item id and type
	// if its a node, read node from memory and write all data to clipboard
	const handleKeyDown = ( e ) => {
		const charCode = String.fromCharCode( e.which ).toLowerCase();
		if ( e.ctrlKey ) {
			switch ( charCode ) {
				case 'c':
					const { activeItem } = client.readQuery( { query: ACTIVE_ITEM } );
					if ( activeItem.itemType === 'node' ) {
						const { itemId } = activeItem;
						const { Nodes } = client.readQuery( { query: NODES_BASE_DATA } );
						const nodeToCopy = Nodes.find( aNode => aNode.id === itemId );
						const nodeCopy = deepCopy( nodeToCopy );
						const { label, type, story, synchronous, unreliable } = nodeCopy;
						navigator.clipboard.writeText( JSON.stringify( { label, type, story, synchronous, unreliable, isNode: true } ) )
							.catch( error => addLogMessage( client, 'Error when saving to clipboard: ' + error.message ) );
					}
					break;
				case 'v':
					navigator.clipboard.readText()
						.then( clipText => {
							if ( editingData.hasEditRights ) {
								try {
									const clipBoardData = JSON.parse( clipText );
									if ( clipBoardData.isNode ) {
										const { label, type, story, synchronous, unreliable } = clipBoardData;
										createNode( {
											variables: {
												label, type, props: { story, synchronous, unreliable },
											},
										} )
											.catch( e => addLogMessage( client, 'Error when creating node from paste command: ' + e.message ) );
									}
								}
								catch ( e ) {
									addLogMessage( client, `clipboard text can't be processed by JSON: ` + clipText );
								}
							}
						} );
					break;
				default:
					addLogMessage( client, 'Pressed Something' );
					break;
			}
		}
	};

	return (
		<div className='bordered editor-pane margin-base' onClick={ handleClick } onKeyDown={ handleKeyDown }>
			<Graph
				graph={ graph }
				options={ options }
				events={ events }
			/>
		</div>
	);
};

export default withLocalDataAccess( EditorPane );
