import { NodeImages } from './Graph/Images';

export const typeOptions = [
	{ 'text': 'API', 'value': 'API', image: NodeImages.API },
	{ 'text': 'Event', 'value': 'Event', image: NodeImages.Event },
	{ 'text': 'Persistence', 'value': 'Persistence', image: NodeImages.Persistence },
	{ 'text': 'Query', 'value': 'Query', image: NodeImages.API },
	{ 'text': 'Abstract User Interface', 'value': 'AbstractUserInterface', image: NodeImages.AbstractUserInterface },
	{ 'text': 'Command', 'value': 'Command', image: NodeImages.Command },
	{ 'text': 'Object', 'value': 'Object', image: NodeImages.Object },
	{ 'text': 'Computation', 'value': 'Computation', image: NodeImages.Computation },
	{ 'text': 'Container', 'value': 'Container' },
	{ 'text': 'Domain', 'value': 'Domain' },
	{ 'text': 'Invariant', 'value': 'Invariant', image: NodeImages.Invariant },
	{ 'text': 'Architectural Decision Record', 'value': 'ArchitecturalDecisionRecord', image: NodeImages.ArchitecturalDecisionRecord },
	{ 'text': 'Definition', 'value': 'Definition', image: NodeImages.Definition },
];