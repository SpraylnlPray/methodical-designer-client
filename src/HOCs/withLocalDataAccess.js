import React from 'react';
import { useApolloClient, useQuery } from '@apollo/client';
import { EDITING_RIGHTS, LINKS_WITH_TAGS, NODES_WITH_TAGS } from '../queries/LocalQueries';
import { addLogMessage } from '../utils';

const withLocalDataAccess = ( Component ) => {
	return function( props ) {
		const client = useApolloClient();
		const { data: localNodeData } = useQuery( NODES_WITH_TAGS, {
			onError: err => addLogMessage( client, 'Error when getting local nodes: ' + err.message ),
		} );
		const { data: localLinkData } = useQuery( LINKS_WITH_TAGS, {
			onError: err => addLogMessage( client, 'Error when getting local links: ' + err.message ),
		} );
		const { data: editingData } = useQuery( EDITING_RIGHTS, {
			onError: err => addLogMessage( client, 'Error when getting editing rights: ' + err.message ),
		} );

		const getNodesNeedingRecalculation = () => {
			if ( localNodeData ) {
				const { Nodes } = localNodeData;
				return Nodes.filter( aNode => aNode.needsCalculation );
			}
			return [];
		};

		const getLinksNeedingRecalculation = () => {
			if ( localLinkData ) {
				const { Links } = localLinkData;
				return Links.filter( aLink => aLink.needsCalculation );
			}
			return [];
		};

		const getMovedNodes = () => {
			if ( localNodeData ) {
				const { Nodes } = localNodeData;
				return Nodes.filter( aNode => aNode.moved );
			}
			return [];
		};

		const getCreatedNodes = () => {
			if ( localNodeData ) {
				const { Nodes } = localNodeData;
				return Nodes.filter( node => node.created );
			}
			return [];
		};

		const getEditedNodes = () => {
			if ( localNodeData ) {
				const { Nodes } = localNodeData;
				const notNewlyCreatedNodes = Nodes.filter( node => !node.created );
				return notNewlyCreatedNodes.filter( node => node.edited );
			}
			return [];
		};

		const getCreatedLinks = () => {
			if ( localLinkData ) {
				const { Links } = localLinkData;
				return Links.filter( link => link.created );
			}
			return [];
		};

		const getEditedLinks = () => {
			if ( localLinkData ) {
				const { Links } = localLinkData;
				const notNewlyCreatedLinks = Links.filter( link => !link.created );
				return notNewlyCreatedLinks.filter( link => link.edited );
			}
			return [];
		};

		const getDeletedNodes = () => {
			if ( localNodeData ) {
				const { Nodes } = localNodeData;
				return Nodes.filter( node => node.deleted );
			}
			return [];
		};

		const getDeletedLinks = () => {
			if ( localLinkData ) {
				const { Links } = localLinkData;
				return Links.filter( link => link.deleted );
			}
			return [];
		};

		const hasUnsavedLocalChanges = () => {
			const deletedNodes = getDeletedNodes();
			const deletedLinks = getDeletedLinks();

			const createdNodes = getCreatedNodes();
			const editedNodes = getEditedNodes();

			const createdLinks = getCreatedLinks();
			const editedLinks = getEditedLinks();
			if ( deletedNodes && deletedLinks && createdNodes &&
				editedNodes && createdLinks && editedLinks ) {
				return deletedNodes.length > 0 || deletedLinks.length > 0
					|| createdNodes.length > 0 || editedNodes.length > 0
					|| createdLinks.length > 0 || editedLinks.length > 0;
			}
			return false;
		};

		return (
			<Component props={ props } hasUnsavedLocalChanges={ hasUnsavedLocalChanges } getDeletedLinks={ getDeletedLinks }
								 getDeletedNodes={ getDeletedNodes } getEditedLinks={ getEditedLinks }
								 getCreatedLinks={ getCreatedLinks } getEditedNodes={ getEditedNodes }
								 getCreatedNodes={ getCreatedNodes } editingData={ editingData } getMovedNodes={ getMovedNodes }
								 getNodesNeedingRecalculation={ getNodesNeedingRecalculation }
								 getLinksNeedingRecalculation={ getLinksNeedingRecalculation }/>
		);
	};
};

export default withLocalDataAccess;