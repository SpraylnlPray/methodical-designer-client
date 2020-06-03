import { LinkColors, NodeColors } from './Colors';
import { ArrowShapes, NodeShapes } from './Shapes';
import { NodeImages } from './Images';
import { deepCopy } from '../utils';
import GraphField from './GraphField';

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
	#dist = 30;

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
		this.setNodePositions();
		return this.#nodes;
	}

	get linkDisplayData() {
		this.snap();
		this.handleMultipleConnections();
		this.setLinkVisualizationProps();
		return this.#links;
	}

	setNodePositions() {
		this.field = new GraphField( this.#nodes.length );

		// get the nodes with the most connections
		let maxConnNodeObject = this.getMaxConnNodeObject();
		const nodeIDs = maxConnNodeObject.NodeData.map( data => data.id );
		// and save them centered in the field
		this.field.saveNodes( 1, nodeIDs );

		// go through their connected nodes, and set their positions close to them
		// if their child notes have other connected nodes, do it recursively
		// now save the nodes connected to these around them
		maxConnNodeObject.NodeData.forEach( data => {
			this.field.saveAround( data.id, data.connectedNodeIDs );
		} );


		this.field.setCoords( this.#dist );
		this.#nodes.forEach( node => {
			const nodeInfo = this.field.getNodeInfo( node.id );
			if ( nodeInfo ) {
				node.x = nodeInfo.x;
				node.y = nodeInfo.y;
			}
		} );
	}

	// todo: multiple connections between one node should only be counted as one
	getMaxConnNodeObject() {
		let maxConnCount = 0;
		let maxConnNodeData = [];
		this.#nodes.map( node => {
			if ( node.connectedTo.length > maxConnCount ) {
				const IDs = node.connectedTo.map(connTo => connTo.id);
				maxConnCount = node.connectedTo.length;
				maxConnNodeData = [ { id: node.id, connectedNodeIDs: IDs } ];
			}
			else if ( node.connectedTo.length === maxConnCount ) {
				const IDs = node.connectedTo.map(connTo => connTo.id);
				maxConnNodeData = [ ...maxConnNodeData, { id: node.id, connectedNodeIDs: IDs } ];
			}
			return node;
		} );
		return { maxConnCount, NodeData: maxConnNodeData };
	}

	setNodeVisualizationProps() {
		this.#nodes.forEach( node => {
			this.setNodeImage( node );
			return node;
		} );
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
			const connectedToIDs = node.connectedTo.map( connTo => connTo.id );
			// get all duplicate node IDs in connectedToIDs
			let duplicates = connectedToIDs.reduce( function( acc, el, i, arr ) {
				if ( arr.indexOf( el ) !== i && acc.indexOf( el ) < 0 ) {
					acc.push( el );
				}
				return acc;
			}, [] );

			// find the link for each of them and mark it as multiple
			duplicates.forEach( nodeID => {
				for ( let i = 0; i < this.#links.length; i++ ) {
					if ( this.connectsNodes( node.id, nodeID, this.#links[i] ) && !this.#links[i].checked ) {
						this.#links[i].checked = true;
						this.#links[i].found = true;
						this.#multipleConnIds.push(this.#links[i].id);
					}
				}
			} );
			this.setMultipleLinksProps();
		} );

		// for any links that were not found as multiple connections, set their properties
		this.#links.map( link => {
			if ( !link.found ) {
				link.from = link.x.id;
				link.to = link.y.id;
			}
			return link;
		} );
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
			return link;
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

	connectsNodes( node1ID, node2ID, link ) {
		// eslint-disable-next-line
		return link.x.id === node1ID && link.y.id === node2ID ||
			// eslint-disable-next-line
			link.y.id === node1ID && link.x.id === node2ID;
	}
}
