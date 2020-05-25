import React, { useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client';
import { Message, Button } from 'semantic-ui-react';
import { FREE_EDITING_RIGHTS, REQUEST_EDITING_RIGHTS } from '../queries/ServerMutations';
import { EDITING_RIGHTS } from '../queries/LocalQueries';
import { addLogMessage } from '../utils';
import withLocalDataAccess from '../HOCs/withLocalDataAccess';

const ProjectStatus = ( { props, hasUnsavedLocalChanges, editingData } ) => {
	const { nodeRefetch, linkRefetch } = props;
	const client = useApolloClient();

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
		if ( hasUnsavedLocalChanges() ) {
			alert( 'Please first save local changes to the DB' );
		}
		else {
			runFreeRights()
				.catch( err => addLogMessage( client, `Failed when freeing rights: ${ err }` ) );
		}
	};

	const handleRequestEditRights = ( e ) => {
		e.stopPropagation();
		runRequestRights()
			.catch( err => addLogMessage( client, `Failed when requesting rights: ${ err }` ) );
	};

	const handleForceRights = ( e ) => {
		e.stopPropagation();
		runFreeRights()
			.then( res => runRequestRights()
				.catch( err => addLogMessage( client, `Failed when requesting rights: ${ err }` ) ) )
			.catch( err => addLogMessage( client, `Failed when freeing rights: ${ err }` ) );

	};

	if ( editingData ) {
		if ( !editingData.hasEditRights ) {
			const contentText = negativeRequest ? 'Another user has editing rights.' : 'You have no editing rights yet.';

			return (
				<div className='rights-pane'>
					<Message warning>
						<Message.Header>No Edit Rights</Message.Header>
						<Message.Content>{ contentText }</Message.Content>
					</Message>
					<Button color='teal' className='rights-button' onClick={ handleRequestEditRights }>Request Now</Button>
					{ negativeRequest &&
					<Button color='red' className='rights-button' onClick={ handleForceRights }>Force Rights</Button> }
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

export default withLocalDataAccess( ProjectStatus );