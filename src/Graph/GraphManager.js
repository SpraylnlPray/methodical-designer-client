import { LinkColors, NodeColors } from './Colors';
import { ArrowShapes, NodeShapes } from './Shapes';
import { NodeImages } from './Images';
import { deepCopy } from '../utils';

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
		this.handleCoordinates();
		return this.#nodes || [];
	}

	get linkDisplayData() {
		this.setLinkVisualizationProps();
		return this.#links;
	}

	handleCoordinates() {
		for ( let node of this.#nodes ) {
			if ( node.x === '' ) {
				node.x = undefined;
			}
			if ( node.y === '' ) {
				node.y = undefined;
			}
		}
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
}
