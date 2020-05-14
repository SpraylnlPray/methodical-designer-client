import { LinkColors, NodeColors } from './Colors';
import { ArrowShapes, NodeShapes } from './Shapes';

export default class GraphManager {
	#nodes = {};
	#links = {};
	#options = {
		layout: {
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
	#linkDict = {};

	constructor( nodes, links ) {
		this.#nodes = nodes;
		this.#links = links;
		this.#linkDict = this.createLinkDict();
	}

	get graphOptions() {
		return this.#options;
	}

	get nodeDisplayData() {
		const nodeList = this.#nodes.map( node => ({ id: node.id, label: node.label, type: node.type }) );
		this.setNodeVisualizationProps( nodeList );
		return nodeList;
	}

	get linkDisplayData() {
		return this.createLinks( this.#linkDict );
	}

	createLinkDict() {
		let dict = {};
		this.#links.forEach( link => {
			dict[link.id] = { ...link };
			dict[link.id].added = false;
		} );
		return dict;
	};

	setNodeVisualizationProps( nodes ) {
		nodes.forEach( node => {
			switch ( node.type ) {
				case 'API':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'AbstractUserInterface':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Persistence':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Query':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Command':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Event':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Object':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Computation':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Domain':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Invariant':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'ArchitecturalDecisionRecord':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				case 'Definition':
					this.setNodeProps( node, NodeShapes[node.type], NodeColors[node.type] );
					break;
				default:
					this.setNodeProps( node, NodeShapes.Default, NodeColors.Default );
					break;
			}
		} );
	}

	setNodeProps( node, shape, color ) {
		node.shape = shape;
		node.color = color;
	}

	createLinks() {
		const linkList = this.getLinkList();
		this.setLinkVisualizationProps( linkList );
		return linkList;
	};

	setLinkVisualizationProps( links ) {
		links.forEach( link => {
			const { x_end, y_end } = link;
			switch ( link.type ) {
				case 'PartOf':
					this.setLinkProps( link, LinkColors[link.type], x_end, y_end );
					break;
				case 'Trigger':
					this.setLinkProps( link, LinkColors[link.type], x_end, y_end );
					break;
				case 'Read':
					this.setLinkProps( link, LinkColors[link.type], x_end, y_end );
					break;
				case 'Mutate':
					this.setLinkProps( link, LinkColors[link.type], x_end, y_end );
					break;
				case 'Generic':
					this.setLinkProps( link, LinkColors[link.type], x_end, y_end );
					break;
				default:
					this.setLinkProps( link, LinkColors.Default, x_end, y_end );
					break;
			}
		} );
	}

	setLinkProps( link, color, x_end, y_end ) {
		// x is from, y is to!
		link.color = color;
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
				const linksToCheck = this.#links.filter( checkLink => checkLink.id !== link.id );
				linksToCheck.forEach( linkToCheck => {
						// if link to check link hasn't been added yet
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
		const { id, x: { id: from }, y: { id: to }, label, type, x_end, y_end } = link;
		return { id, from, to, label, type, x_end, y_end };
	};

	haveSameNodes = ( link1, link2 ) => {
		return link1.x.id === link2.x.id && link1.y.id === link2.y.id ||
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
			// otherwise add just the checked link to the temp array
			similarLinks.push( link2 );
		}
		this.#linkDict[link2.id].added = true;
	};
}
