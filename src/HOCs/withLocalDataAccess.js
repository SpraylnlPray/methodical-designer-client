import React from 'react';
import { useQuery } from '@apollo/client';
import {
	DELETED_LINKS, DELETED_NODES, EDITING_RIGHTS, LOCAL_LINKS_TAGS, LOCAL_NODES_TAGS,
} from '../queries/LocalQueries';

const withLocalDataAccess = ( Component ) => {
	return function( props ) {
		const { data: localNodeData } = useQuery( LOCAL_NODES_TAGS );
		const { data: localLinkData } = useQuery( LOCAL_LINKS_TAGS );
		const { data: deletedNodesData } = useQuery( DELETED_NODES );
		const { data: deletedLinksData } = useQuery( DELETED_LINKS );
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
			const { deletedNodes } = deletedNodesData;
			return deletedNodes;
		};

		const getDeletedLinks = () => {
			const { deletedLinks } = deletedLinksData;
			return deletedLinks;
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