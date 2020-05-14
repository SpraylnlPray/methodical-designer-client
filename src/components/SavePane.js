import React from 'react';
import { Button } from 'semantic-ui-react';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
	CREATE_LINK, CREATE_NODE, DELETE_LINK, DELETE_LINK_END, DELETE_NODE, DELETE_SEQUENCE, MERGE_LINK_END, MERGE_SEQUENCE,
	UPDATE_LINK, UPDATE_NODE,
} from '../queries/ServerMutations';
import { DELETED_LINKS, DELETED_NODES, LOCAL_LINKS_TAGS, LOCAL_NODES_TAGS } from '../queries/LocalQueries';
import { deleteLinkOrNode, handleLinkEnds, handleSequence } from '../TransactionUtils';
import LoadingMessage from './LoadingMessage';

const SavePane = ( { client } ) => {
	const [ runCreateNode, { loading: nodeCreateLoading } ] = useMutation( CREATE_NODE );
	const [ runUpdateNode, { loading: nodeUpdateLoading } ] = useMutation( UPDATE_NODE );
	const [ runCreateLink, { loading: createLinkLoading } ] = useMutation( CREATE_LINK );
	const [ runUpdateLink, { loading: updateLinkLoading } ] = useMutation( UPDATE_LINK );
	const [ runDeleteNode, { loading: deleteNodeLoading } ] = useMutation( DELETE_NODE );
	const [ runDeleteLink, { loading: deleteLinkLoading } ] = useMutation( DELETE_LINK );
	const [ runMergeSeq, { loading: mergeSeqLoading } ] = useMutation( MERGE_SEQUENCE );
	const [ runDeleteSeq, { loading: deleteSeqLoading } ] = useMutation( DELETE_SEQUENCE );
	const [ runMergeLinkEnd, { loading: mergeLinkEndLoading } ] = useMutation( MERGE_LINK_END );
	const [ runDeleteLinkEnd, { loading: deleteLinkEndLoading } ] = useMutation( DELETE_LINK_END );

	const { data: localNodeData } = useQuery( LOCAL_NODES_TAGS );
	const { data: localLinkData } = useQuery( LOCAL_LINKS_TAGS );
	const { data: deletedNodesData } = useQuery( DELETED_NODES );
	const { data: deletedLinksData } = useQuery( DELETED_LINKS );

	const handleSave = e => {
		if ( localNodeData?.Nodes && localLinkData?.Links ) {
			const { Nodes } = localNodeData;
			const { Links } = localLinkData;

			const createdNodes = Nodes.filter( node => node.created );
			const notNewlyCreatedNodes = Nodes.filter( node => !node.created );
			const editedNodes = notNewlyCreatedNodes.filter( node => node.edited );

			const createdLinks = Links.filter( link => link.created );
			const notNewlyCreatedLinks = Links.filter( link => !link.created );
			const editedLinks = notNewlyCreatedLinks.filter( link => link.edited );

			const { deletedNodes } = deletedNodesData;
			const { deletedLinks } = deletedLinksData;

			let nodePromises = [];
			let createLinkPromises = [];
			let createLinkEndAndSeqPromises = [];
			let editedLinkPromises = [];
			let editedLinkEndAndSeqPromises = [];
			let deleteLinkPromises = [];
			let deleteNodePromises = [];

			for ( let node of createdNodes ) {
				console.log( 'saving created node ', node );
				const { id, label, story, synchronous, type, unreliable } = node;
				const variables = { id, label, type, props: { story, synchronous, unreliable } };
				nodePromises.push( runCreateNode( { variables } ) );
			}

			for ( let node of editedNodes ) {
				console.log( 'saving updated node ', node );
				const { id, label, story, synchronous, type, unreliable } = node;
				const variables = { id, props: { label, type, story, synchronous, unreliable } };
				nodePromises.push( runUpdateNode( { variables } ) );
			}

			Promise.all( nodePromises )
			.then( () => {
				console.log( 'finished creating and updating nodes, will now handle created links' );
				for ( let link of createdLinks ) {
					console.log( 'saving created link ', link );
					const { id, label, type, x: { id: x_id }, y: { id: y_id }, story, optional } = link;
					const variables = { id, label, type, x_id, y_id, props: { story, optional } };
					createLinkPromises.push( runCreateLink( { variables } ) );
				}
				Promise.all( createLinkPromises )
				.then( () => {
					console.log( 'finished creating links, will now handle sequences and link ends' );
					for ( let link of createdLinks ) {
						handleSequence( link, createLinkEndAndSeqPromises, runMergeSeq, runDeleteSeq );
						handleLinkEnds( link, createLinkEndAndSeqPromises, runMergeLinkEnd, runDeleteLinkEnd );
					}

					Promise.all( createLinkEndAndSeqPromises )
					.then( () => {
						console.log( 'finished sequences and link ends, will now handle edited links' );
						for ( let link of editedLinks ) {
							console.log( 'saving edited link ', link );
							const { id, label, type, x: { id: x_id }, y: { id: y_id }, story, optional } = link;
							const variables = { id, props: { story, optional, label, type, x_id, y_id } };
							editedLinkPromises.push( runUpdateLink( { variables } ) );
						}

						Promise.all( editedLinkPromises )
						.then( () => {
							console.log( 'finished saving edited links, will now handle sequences and link ends' );
							for ( let link of editedLinks ) {
								handleSequence( link, editedLinkEndAndSeqPromises, runMergeSeq, runDeleteSeq );
								handleLinkEnds( link, editedLinkEndAndSeqPromises, runMergeLinkEnd, runDeleteLinkEnd );
							}

							Promise.all( editedLinkEndAndSeqPromises )
							.then( () => {
								console.log( 'finished sequences and link ends, will now delete links' );
								for ( let link of deletedLinks ) {
									deleteLinkOrNode( link, deleteLinkPromises, runDeleteLink );
								}

								Promise.all( deleteLinkPromises )
								.then( () => {
									console.log( 'finished deleting links, will now delete nodes' );
									for ( let node of deletedNodes ) {
										deleteLinkOrNode( node, deleteNodePromises, runDeleteNode );
									}

									Promise.all( deleteNodePromises )
									.then( () => {
										console.log( 'finished deleting nodes, resetting local store' );
										client.writeQuery( {
											query: gql`
                        query {
                          deletedNodes
                          deletedLinks
                        }`,
											data: {
												deletedNodes: [],
												deletedLinks: [],
											},
										} );
									} );
								} ).catch( reason => console.log( `failed because of ${ reason }` ) );
							} ).catch( reason => console.log( `failed because of ${ reason }` ) );
						} ).catch( reason => console.log( `failed because of ${ reason }` ) );
					} ).catch( reason => console.log( `failed because of ${ reason }` ) );
				} ).catch( reason => console.log( `failed because of ${ reason }` ) );
			} ).catch( reason => console.log( `failed because of ${ reason }` ) );
		}
	};
	const statusRender = () => {
		if ( nodeCreateLoading ) {
			return <LoadingMessage message='Saving Created Nodes'/>;
		}
		else if ( nodeUpdateLoading ) {
			return <LoadingMessage message='Saving Updated Nodes'/>;
		}
		else if ( createLinkLoading ) {
			return <LoadingMessage message='Saving Created Links'/>;
		}
		else if ( updateLinkLoading ) {
			return <LoadingMessage message='Saving Updated Links'/>;
		}
		else if ( deleteNodeLoading ) {
			return <LoadingMessage message='Saving Deleted Nodes'/>;
		}
		else if ( deleteLinkLoading ) {
			return <LoadingMessage message='Saving Deleted Links'/>;
		}
		else if ( mergeSeqLoading ) {
			return <LoadingMessage message='Saving Updated Sequences'/>;
		}
		else if ( deleteSeqLoading ) {
			return <LoadingMessage message='Saving Deleted Sequences'/>;
		}
		else if ( mergeLinkEndLoading ) {
			return <LoadingMessage message='Saving Edited Link Ends'/>;
		}
		else if ( deleteLinkEndLoading ) {
			return <LoadingMessage message='Saving Deleted Link Ends'/>;
		}

		return '';
	};

	return (
		<div className='flex-area bordered'>
			{ statusRender() }
			<Button onClick={ handleSave }>Save to DB</Button>
		</div>
	);
};

export default SavePane;
