import React from 'react';
import { Icon, Message } from 'semantic-ui-react';

const ServerStartupMessage = () => {
	return (
		<div className='bordered editor-pane margin-base flex-center'>
			<Message icon info floating className={ 'editor-loading-message' }>
				<Icon name='circle notched' loading/>
				<Message.Content>
					<Message.Header>Connecting to the server...</Message.Header>
					This may take some time.
				</Message.Content>
			</Message>
		</div>
	);
}

export default ServerStartupMessage;