import React from 'react';
import { useQuery } from '@apollo/client';
import { EDITING_RIGHTS, LINKS_WITH_TAGS, NODES_WITH_TAGS } from '../queries/LocalQueries';

const withLocalDataAccess = ( Component ) => {
	return function( props ) {
		const { data: localNodeData } = useQuery( NODES_WITH_TAGS );
		const { data: localLinkData } = useQuery( LINKS_WITH_TAGS );
		const { data: editingData } = useQuery( EDITING_RIGHTS );

		const getCreatedNodes = () => {
			const { Nodes } = localNodeData;
			return Nodes.filter( node => node.created );
		};

		const getEditedNodes = () => {
			const { Nodes } = localNodeData;
			const notNewlyCreatedNodes = Nodes.filter( node => !node.created );
			return notNewlyCreatedNodes.filter( node => node.edited );
		};

		const getCreatedLinks = () => {
			const { Links } = localLinkData;
			return Links.filter( link => link.created );
		};

		const getEditedLinks = () => {
			const { Links } = localLinkData;
			const notNewlyCreatedLinks = Links.filter( link => !link.created );
			return notNewlyCreatedLinks.filter( link => link.edited );
		};

		const getDeletedNodes = () => {
			const { Nodes } = localNodeData;
			return Nodes.filter( node => node.deleted );
		};

		const getDeletedLinks = () => {
			const { Links } = localLinkData;
			return Links.filter( link => link.deleted );
		};

		const hasUnsavedLocalChanges = () => {
			const deletedNodes = getDeletedNodes();
			const deletedLinks = getDeletedLinks();

			const createdNodes = getCreatedNodes();
			const editedNodes = getEditedNodes();

			const createdLinks = getCreatedLinks();
			const editedLinks = getEditedLinks();

			return deletedNodes.length > 0 || deletedLinks.length > 0
				|| createdNodes.length > 0 || editedNodes.length > 0
				|| createdLinks.length > 0 || editedLinks.length > 0;
		};

		return (
			<Component props={ props } hasUnsavedLocalChanges={ hasUnsavedLocalChanges } getDeletedLinks={ getDeletedLinks }
								 getDeletedNodes={ getDeletedNodes } getEditedLinks={ getEditedLinks }
								 getCreatedLinks={ getCreatedLinks } getEditedNodes={ getEditedNodes }
								 getCreatedNodes={ getCreatedNodes } editingData={ editingData }/>
		);
	};
};

export default withLocalDataAccess;