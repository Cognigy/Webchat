// React 18's prop types don't know the `inert` attribute yet, so styled
// components type it as an optional string: the string form ("") renders the
// bare attribute, and emotion forwards it to the DOM. Drop this once on
// React 19, which supports `inert` as a boolean prop.
export interface InertProps {
	inert?: string;
}
