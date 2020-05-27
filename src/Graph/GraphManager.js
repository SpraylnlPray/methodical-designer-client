import { LinkColors, NodeColors } from './Colors';
import { ArrowShapes, NodeShapes } from './Shapes';
import { NodeImages } from './Images';
import { deepCopy } from '../utils';

export default class GraphManager {
	#nodes = {};
	#links = {};
	#linkDict = {};
	#nodeDict = {};
	#options = {
		layout: {
			hierarchical: true,
			improvedLayout: true,
		},
		edges: {
			color: '#000000',
			physics: true,
			width: 2,
			smooth: {
				enabled: false,
			},
			font: {
				size: 12,
				align: 'middle',
			},
			arrows: {
				to: { enabled: false },
				from: { enabled: false },
			},
		},
		nodes: {
			physics: false,
			widthConstraint: {
				minimum: 25,
				maximum: 50,
			},
		},
		height: '100%',
		autoResize: true,
		interaction: {
			hoverConnectedEdges: false,
			selectConnectedEdges: false,
		},
		physics: {
			enabled: true,
		},
	};


	constructor( nodes, links ) {
		this.#nodes = nodes;
		this.#links = links;
		this.#linkDict = this.createLinkDict();
		this.#nodeDict = this.createNodeDict();
	}

	get graphOptions() {
		return this.#options;
	}

	get nodeDisplayData() {
		this.handleCollapsables();
		this.setNodeVisualizationProps();
		return this.createNodeList();
	}

	createNodeList() {
		let nodeList = [];
		for ( let nodeID in this.#nodeDict ) {
			let node = this.#nodeDict[nodeID];
			nodeList.push( {
				id: node.id,
				label: node.label,
				type: node.type,
				hidden: !!node.hidden,
				image: node.image,
				shape: node.shape,
			} );
		}
		return nodeList;
	}

	handleCollapsables() {
		for ( let nodeID in this.#nodeDict ) {
			let node = this.#nodeDict[nodeID];
			node.hidden = false;
		}
		for ( let nodeID in this.#nodeDict ) {
			let node = this.#nodeDict[nodeID];
			// if the node is a container or domain and its childs should be hidden
			if ( this.isCollapsable( node ) && node.collapse ) {
				// find any links connected to it
				this.handleConnectedNodes( node, node );
			}
		}
	}

	isCollapsable( node ) {
		return node.type === 'Container' || node.type === 'Domain';
	}

	// collapsable: the 'parent' element of a 'part-of' connection
	// sourceNode: the node who dispatched the 'collapse' call
	// hide: true or false, whether to set 'hidden' to true or false
	handleConnectedNodes( collapsable, sourceNode ) {
		// get all connected nodes to this collapsable
		const connectedNodesIDs = [];
		for ( let linkID in this.#linkDict ) {
			const link = this.#linkDict[linkID];
			// if the x node is the collapsable, save the y node ID
			if ( link.x.id === collapsable.id ) {
				connectedNodesIDs.push( link.y.id );
			}
		}
		for ( let nodeID of connectedNodesIDs ) {
			let nodeToBeAdapted = this.#nodeDict[nodeID];
			if ( !nodeToBeAdapted.visited && nodeToBeAdapted.id !== sourceNode.id ) {
				// set the hidden property to the specified value
				nodeToBeAdapted.hidden = true;
				nodeToBeAdapted.visited = true;
				nodeToBeAdapted.hiddenBy = sourceNode.id;
				if ( this.isCollapsable( nodeToBeAdapted ) ) {
					this.handleConnectedNodes( nodeToBeAdapted, sourceNode );
				}
			}
		}
	}

	get linkDisplayData() {
		return this.createLinks();
	}

	createNodeDict() {
		let dict = {};
		this.#nodes.forEach( node => {
			dict[node.id] = deepCopy( node );
		} );
		return dict;
	}

	createLinkDict() {
		let dict = {};
		this.#links.forEach( link => {
			dict[link.id] = deepCopy( link );
		} );
		return dict;
	};

	setNodeVisualizationProps( nodes ) {
		for ( let nodeID in this.#nodeDict ) {
			let node = this.#nodeDict[nodeID];
			this.setNodeImage( node );
		}
	}

	setNodeImage( node ) {
		if ( NodeImages[node.type] ) {
			node.image = NodeImages[node.type];
			node.shape = 'image';
		}
		else {
			node.shape = NodeShapes[node.type];
			node.color = NodeColors[node.type];
		}
	}

	createLinks() {
		this.snap();
		const linkList = this.getLinkList();
		this.setLinkVisualizationProps( linkList );
		return linkList;
	};

	setLinkVisualizationProps( links ) {
		links.forEach( link => {
			const { x_end, y_end } = link;
			this.setLinkProps( link, x_end, y_end );
		} );
	}

	setLinkProps( link, x_end, y_end ) {
		// x is from, y is to!
		if ( LinkColors[link.type] ) {
			link.color = LinkColors[link.type];
		}
		else {
			link.color = LinkColors.Default;
		}

		if ( link?.sequence ) {
			const { group, seq } = link.sequence;
			if ( group?.length > 0 || seq?.length > 0 ) {
				link.label = `${ group } - ${ seq }`;
			}
		}

		link.arrows = {};
		if ( x_end?.arrow?.length > 0 ) {
			link.arrows.from = {
				enabled: true,
				type: ArrowShapes[x_end.arrow],
			};
		}
		if ( y_end?.arrow?.length > 0 ) {
			link.arrows.to = {
				enabled: true,
				scaleFactor: 1,
				type: ArrowShapes[y_end.arrow],
			};
		}
	}

	getOtherLinks( link ) {
		const otherLinks = [];
		for ( let linkID in this.#linkDict ) {
			if ( linkID !== link.id ) {
				otherLinks.push( this.#linkDict[linkID] );
			}
		}
		return otherLinks;
	}

	getLinkList() {
		// this is an array of arrays
		// each array inside contains the links between two nodes that are connected by multiple links
		const multipleConnectionsList = [];
		const normalLinks = [];
		// go over each link
		for ( let key in this.#linkDict ) {
			const similarLinks = [];
			let link = this.#linkDict[key];
			// if the link has not been checked yet
			if ( !link.added ) {
				// get all links that are not the link itself
				const linksToCheck = this.getOtherLinks( link );
				linksToCheck.forEach( linkToCheck => {
						// if link to check hasn't been added yet
						if ( !linkToCheck.added ) {
							// if both are connected to the same nodes
							if ( this.haveSameNodes( link, linkToCheck ) ) {
								this.saveDoubleLink( link, linkToCheck, similarLinks );
							}
						}
					},
				);
				// if, after comparing with all other links, it hasn't been added yet, it is a normal link so add and mark it
				if ( !link.added ) {
					normalLinks.push( link );
					link.added = true;
				}
				// if, however, there were links found that share both nodes, we need to save them
				if ( similarLinks.length > 0 ) {
					multipleConnectionsList.push( similarLinks );
				}
			}
		}

		const normalLinkData = normalLinks.map( link => {
			const defaultData = this.getDefaultLinkData( link );
			return {
				...defaultData,
			};
		} );

		const multipleLinkData = this.normalizeMultipleConnections( multipleConnectionsList );

		return multipleLinkData.concat( normalLinkData );
	}

	snap() {
		for ( let linkID in this.#linkDict ) {
			let link = this.#linkDict[linkID];
			const x_node = this.#nodeDict[link.x.id];
			const y_node = this.#nodeDict[link.y.id];
			// snapping should only happen if one of them is still visible
			if ( !this.areBothHidden( x_node, y_node ) && link.type !== 'PartOf' ) {
				// if x_node is hidden, it has a 'hiddenBy' ID where the link should now snap to
				if ( this.isHidden( x_node ) ) {
					this.#linkDict[linkID].x.id = x_node.hiddenBy;
				}
				else if ( this.isHidden( y_node ) ) {
					this.#linkDict[linkID].y.id = y_node.hiddenBy;
				}
			}
		}
	}

	isHidden( node ) {
		return node.hidden;
	}

	areBothHidden( node1, node2 ) {
		return this.isHidden( node1 ) && this.isHidden( node2 );
	}

	normalizeMultipleConnections = multipleConnectionsList => {
		multipleConnectionsList = multipleConnectionsList.map( list => {
			return list.map( ( link, index ) => {
				const defaultData = this.getDefaultLinkData( link );
				return {
					...defaultData,
					smooth: {
						enabled: index !== 0,
						type: 'horizontal',
						roundness: index / list.length,
					},
				};
			} );
		} );

		let multipleLinkDisplayData = [];
		multipleConnectionsList.forEach( list => {
			multipleLinkDisplayData.push( ...list );
		} );
		return multipleLinkDisplayData;
	};

	getDefaultLinkData = link => {
		// x is from, y is to!
		const { id, x: { id: from }, y: { id: to }, label, type, x_end, y_end, sequence } = link;
		return { id, from, to, label, type, x_end, y_end, sequence };
	};

	haveSameNodes = ( link1, link2 ) => {
		// eslint-disable-next-line
		return link1.x.id === link2.x.id && link1.y.id === link2.y.id ||
			// eslint-disable-next-line
			link1.y.id === link2.x.id && link1.x.id === link2.y.id;
	};

	saveDoubleLink = ( link1, link2, similarLinks ) => {
		// and the link itself has not been checked yet
		if ( !link1.added ) {
			// add both to the temporary array and mark them as checked
			similarLinks.push( link1, link2 );
			link1.added = true;
		}
		else {
			// otherwise add just the not checked link to the temp array
			similarLinks.push( link2 );
		}
		this.#linkDict[link2.id].added = true;
	};
}
