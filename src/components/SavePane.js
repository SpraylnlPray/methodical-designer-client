import React from 'react';
import { Button } from 'semantic-ui-react';
import { gql, useMutation, useQuery } from '@apollo/client';
import {
	CREATE_LINK, CREATE_NODE, DELETE_LINK, DELETE_LINK_END, DELETE_NODE, DELETE_SEQUENCE, MERGE_LINK_END, MERGE_SEQUENCE,
	UPDATE_LINK, UPDATE_NODE,
} from '../queries/ServerMutations';
import {
	DELETED_LINKS, DELETED_NODES, EDITING_RIGHTS, LOCAL_LINKS_TAGS, LOCAL_NODES_TAGS,
} from '../queries/LocalQueries';
import { deleteLinkOrNode, handleLinkEnds, handleSequence } from '../TransactionUtils';
import LoadingMessage from './LoadingMessage';
import { addLogMessage } from '../utils';

const SavePane = ( { client } ) => {
	const { data: editingData } = useQuery( EDITING_RIGHTS );

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

			addLogMessage( client, `saving created nodes` );
			for ( let node of createdNodes ) {
				addLogMessage( client, `saving created node ${ node }` );
				const { id, label, story, synchronous, type, unreliable } = node;
				const variables = { id, label, type, props: { story, synchronous, unreliable } };
				nodePromises.push( runCreateNode( { variables } ) );
			}
			addLogMessage( client, `saving updated nodes` );
			for ( let node of editedNodes ) {
				addLogMessage( client, `saving updated node ${ node.id }` );
				const { id, label, story, synchronous, type, unreliable } = node;
				const variables = { id, props: { label, type, story, synchronous, unreliable } };
				nodePromises.push( runUpdateNode( { variables } ) );
			}

			Promise.all( nodePromises )
			.then( () => {
				addLogMessage( client, `finished creating and updating nodes, will now handle created links` );
				for ( let link of createdLinks ) {
					addLogMessage( client, `saving created link ${ link.id }` );
					const { id, label, type, x: { id: x_id }, y: { id: y_id }, story, optional } = link;
					const variables = { id, label, type, x_id, y_id, props: { story, optional } };
					createLinkPromises.push( runCreateLink( { variables } ) );
				}
				Promise.all( createLinkPromises )
				.then( () => {
					addLogMessage( client, `finished creating links, will now handle sequences and link ends` );
					for ( let link of createdLinks ) {
						handleSequence( client, link, createLinkEndAndSeqPromises, runMergeSeq, runDeleteSeq );
						handleLinkEnds( client, link, createLinkEndAndSeqPromises, runMergeLinkEnd, runDeleteLinkEnd );
					}

					Promise.all( createLinkEndAndSeqPromises )
					.then( () => {
						addLogMessage( client, `finished sequences and link ends, will now handle edited links` );
						for ( let link of editedLinks ) {
							addLogMessage( client, `saving edited link ${ link }` );
							const { id, label, type, x: { id: x_id }, y: { id: y_id }, story, optional } = link;
							const variables = { id, props: { story, optional, label, type, x_id, y_id } };
							editedLinkPromises.push( runUpdateLink( { variables } ) );
						}

						Promise.all( editedLinkPromises )
						.then( () => {
							addLogMessage( client, `finished saving edited links, will now handle sequences and link ends` );
							for ( let link of editedLinks ) {
								handleSequence( client, link, editedLinkEndAndSeqPromises, runMergeSeq, runDeleteSeq );
								handleLinkEnds( client, link, editedLinkEndAndSeqPromises, runMergeLinkEnd, runDeleteLinkEnd );
							}

							Promise.all( editedLinkEndAndSeqPromises )
							.then( () => {
								addLogMessage( client, `finished sequences and link ends, will now delete links` );
								for ( let link of deletedLinks ) {
									deleteLinkOrNode( client, link, deleteLinkPromises, runDeleteLink );
								}

								Promise.all( deleteLinkPromises )
								.then( () => {
									addLogMessage( client, `finished deleting links, will now delete nodes` );
									for ( let node of deletedNodes ) {
										deleteLinkOrNode(client, node, deleteNodePromises, runDeleteNode );
									}

									Promise.all( deleteNodePromises )
									.then( () => {
										addLogMessage( client, `finished deleting nodes, resetting local store` );
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
								} ).catch( reason => addLogMessage( client, `failed because of ${ reason }` ) );
							} ).catch( reason => addLogMessage( client, `failed because of ${ reason }` ) );
						} ).catch( reason => addLogMessage( client, `failed because of ${ reason }` ) );
					} ).catch( reason => addLogMessage( client, `failed because of ${ reason }` ) );
				} ).catch( reason => addLogMessage( client, `failed because of ${ reason }` ) );
			} ).catch( reason => addLogMessage( client, `failed because of ${ reason }` ) );
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
		<div className='flex-area save-area'>
			{ statusRender() }
			<Button disabled={ !editingData.hasEditRights } className='save-button' onClick={ handleSave }>Save</Button>
		</div>
	);
};

export default SavePane;
