import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Message, Button } from 'semantic-ui-react';
import { FREE_EDITING_RIGHTS, REQUEST_EDITING_RIGHTS } from '../queries/ServerMutations';
import {
	DELETED_LINKS, DELETED_NODES, EDITING_RIGHTS, LOCAL_LINKS_TAGS, LOCAL_NODES_TAGS,
} from '../queries/LocalQueries';

const ProjectStatus = ( { nodeRefetch, linkRefetch } ) => {
	const { data } = useQuery( EDITING_RIGHTS );

	const { data: localNodeData } = useQuery( LOCAL_NODES_TAGS );
	const { data: localLinkData } = useQuery( LOCAL_LINKS_TAGS );
	const { data: deletedNodesData } = useQuery( DELETED_NODES );
	const { data: deletedLinksData } = useQuery( DELETED_LINKS );

	const [ negativeRequest, setNegativeRequest ] = useState( false );

	const [ runFreeRights ] = useMutation( FREE_EDITING_RIGHTS, {
		update( cache, { data: { FreeEditRights } } ) {
			cache.writeQuery( {
				query: EDITING_RIGHTS,
				// inverted because operation will return true if freeing worked
				data: { hasEditRights: !FreeEditRights.success },
			} );
		},
	} );

	const [ runRequestRights ] = useMutation( REQUEST_EDITING_RIGHTS, {
		update( cache, { data: { RequestEditRights } } ) {
			if ( RequestEditRights.success ) {
				nodeRefetch();
				linkRefetch();
				setNegativeRequest( false );
			}
			else {
				setNegativeRequest( true );
			}
			cache.writeQuery( {
				query: EDITING_RIGHTS,
				data: { hasEditRights: RequestEditRights.success },
			} );
		},
	} );

	const handleFreeRights = ( e ) => {
		e.stopPropagation();
		const { Nodes } = localNodeData;
		const { Links } = localLinkData;

		const { deletedNodes } = deletedNodesData;
		const { deletedLinks } = deletedLinksData;

		const createdNodes = Nodes.filter( node => node.created );
		const notNewlyCreatedNodes = Nodes.filter( node => !node.created );
		const editedNodes = notNewlyCreatedNodes.filter( node => node.edited );

		const createdLinks = Links.filter( link => link.created );
		const notNewlyCreatedLinks = Links.filter( link => !link.created );
		const editedLinks = notNewlyCreatedLinks.filter( link => link.edited );
		if ( deletedNodes.length > 0 || deletedLinks.length > 0
			|| createdNodes.length > 0 || editedNodes.length > 0
			|| createdLinks.length > 0 || editedLinks.length > 0 ) {
			alert( 'Please first save local changes to the DB' );
		}
		else {
			runFreeRights()
				.catch( err => console.log( err ) );
		}
	};

	const handleRequestEditRights = ( e ) => {
		e.stopPropagation();
		runRequestRights()
			.catch( err => console.log( err ) );
	};

	if ( data ) {
		if ( !data.hasEditRights ) {
			const contentText = negativeRequest ? 'Another user has editing rights.' : 'You have no editing rights yet.';

			return (
				<div className='rights-pane'>
					<Message warning>
						<Message.Header>No Edit Rights</Message.Header>
						<Message.Content>{ contentText }</Message.Content>
					</Message>
					<Button className='rights-button' onClick={ handleRequestEditRights }>Request Now</Button>
				</div>
			);
		}
		else {
			return (
				<div className='rights-pane'>
					<Message positive>
						<Message.Header>You have editing rights!</Message.Header>
						<Message.Content>Feel free to make changes</Message.Content>
					</Message>
					<Button className='rights-button' onClick={ handleFreeRights }>Free Editing Rights</Button>
				</div>
			);
		}
	}
};

export default ProjectStatus;