import { LinkColors, NodeColors } from './Colors';
import { ArrowShapes, NodeShapes } from './Shapes';
import { NodeImages } from './Images';
import { deepCopy } from '../utils';

export default class GraphManager {
	#nodes = {};
	#links = {};
	#multipleConnIds = [];
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

	set nodes( nodes ) {
		this.#nodes = deepCopy( nodes );
		this.#nodes = this.#nodes.filter( node => !node.deleted );
	}

	set links( links ) {
		this.#links = deepCopy( links );
		this.#links = this.#links.filter( link => !link.deleted );
	}

	get graphOptions() {
		return this.#options;
	}

	get nodeDisplayData() {
		this.setNodeVisualizationProps();
		return this.#nodes;
	}

	get linkDisplayData() {
		this.snap();
		this.handleMultipleConnections();
		this.setLinkVisualizationProps();
		return this.#links;
	}

	setNodeVisualizationProps() {
		for ( let node of this.#nodes ) {
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

	setLinkVisualizationProps() {
		this.#links.forEach( link => {
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

	handleMultipleConnections() {
		this.#nodes.forEach( node => {
			this.#multipleConnIds = [];
			// get all links connected to this node that have not been marked as found yet
			const connections = this.#links.filter( link => (link.x.id === node.id || link.y.id === node.id) && !link.checked );
			// check for each connection if any other connection has the same nodes
			this.checkConnectedLinks( connections );
			// for any multiple connections, set their properties
			this.setMultipleLinksProps();
		} );

		// for any links that were not found as multiple connections, set their properties
		this.#links.map( link => {
			if ( !link.found ) {
				link.from = link.x.id;
				link.to = link.y.id;
			}
		} );
	}

	checkConnectedLinks( connections ) {
		// check for each connection
		connections.forEach( conn1 => {
			const tempConns = connections.filter( conn => conn.id !== conn1.id );
			// if any other connection
			tempConns.forEach( conn2 => {
				// has the same nodes
				if ( this.haveSameNodes( conn1, conn2 ) ) {
					// save the IDs
					this.saveMultipleID( conn1 );
					this.saveMultipleID( conn2 );
					// and mark the links as checked and found as double link
					this.#links.map( link => {
						if ( link.id === conn2.id || link.id === conn1.id ) {
							link.checked = true;
							link.found = true;
						}
					} );
				}
			} );
			// after comparing with all others, mark the initial link as checked
			this.#links.map( link => {
				if ( link.id === conn1.id ) {
					link.checked = true;
				}
			} );
		} );
	}

	saveMultipleID( link ) {
		if ( !this.#multipleConnIds.includes( link.id ) ) {
			this.#multipleConnIds.push( link.id );
		}
	}

	setMultipleLinksProps() {
		this.#links.map( link => {
			if ( this.#multipleConnIds.includes( link.id ) ) {
				const index = this.#multipleConnIds.indexOf( link.id );
				link.from = link.x.id;
				link.to = link.y.id;
				link.smooth = {
					enabled: index !== 0,
					type: 'horizontal',
					roundness: index / this.#multipleConnIds.length,
				};
			}
		} );
	}

	snap() {
		this.#links.forEach( link => {
			const x_node = this.#nodes.find( node => node.id === link.x.id );
			const y_node = this.#nodes.find( node => node.id === link.y.id );
			// snapping should only happen if one of them is still visible
			if ( x_node && y_node && !this.areBothHidden( x_node, y_node ) && link.type !== 'PartOf' ) {
				// if x_node is hidden, it has a 'hiddenBy' ID where the link should now snap to
				if ( this.isHidden( x_node ) ) {
					link.x.id = x_node.hiddenBy;
				}
				else if ( this.isHidden( y_node ) ) {
					link.y.id = y_node.hiddenBy;
				}
			}
		} );
	}

	isHidden( node ) {
		return node.hidden;
	}

	areBothHidden( node1, node2 ) {
		return this.isHidden( node1 ) && this.isHidden( node2 );
	}

	haveSameNodes = ( link1, link2 ) => {
		// eslint-disable-next-line
		return link1.x.id === link2.x.id && link1.y.id === link2.y.id ||
			// eslint-disable-next-line
			link1.y.id === link2.x.id && link1.x.id === link2.y.id;
	};
}
