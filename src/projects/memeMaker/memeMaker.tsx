import React from 'react';
import { FormGroup, Label } from 'reactstrap';
import stolfImg from './photos/stolf.jpg';
import './MemeMaker.css';
import './font/style.css';


const photos = [
    { src: stolfImg }
];

const initialState = {
    topText: "",
    bottomText: "",
    isTopDragging: false,
    isBottomDragging: false,
    topY: "10%",
    topX: "50%",
    bottomX: "50%",
    bottomY: "90%"
}

interface MemeMakerState {
    currentImage: number;
    currentImageBase64?: string | null;
    topText: string;
    bottomText: string;
    isTopDragging: boolean;
    isBottomDragging: boolean;
    topY: string;
    topX: string;
    bottomX: string;
    bottomY: string;
}

class MemeMaker extends React.Component<{}, MemeMakerState> {
    imageRef: React.RefObject<SVGImageElement | null> = React.createRef();
    svgRef: React.RefObject<SVGSVGElement | null> = React.createRef();

    private getTopStateObj = (xOffset: number, yOffset: number): Pick<MemeMakerState, 'isTopDragging' | 'isBottomDragging' | 'topX' | 'topY'> => ({
        isTopDragging: true,
        isBottomDragging: false,
        topX: `${xOffset}px`,
        topY: `${yOffset}px`,
    });

    private getBottomStateObj = (xOffset: number, yOffset: number): Pick<MemeMakerState, 'isTopDragging' | 'isBottomDragging' | 'bottomX' | 'bottomY'> => ({
        isBottomDragging: true,
        isTopDragging: false,
        bottomX: `${xOffset}px`,
        bottomY: `${yOffset}px`,
    });

    private topDragOffsetX = 0;
    private topDragOffsetY = 0;
    private bottomDragOffsetX = 0;
    private bottomDragOffsetY = 0;

    constructor(props: {}) {
        super(props);
        this.state = {
            currentImage: 0,
            currentImageBase64: null,
            ...initialState
        };
    }

    componentDidMount() {
        this.openImage(0);
    }


    getBase64Image(img: HTMLImageElement): string {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext("2d");
        context?.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/png");
        return dataURL;
    }

    openImage = (index: number) => {
        const image = photos[index];
        const baseImage = new Image();
        baseImage.src = image.src;
        baseImage.onload = () => {
            const currentImageBase64 = this.getBase64Image(baseImage);
            this.setState(() => ({
                currentImage: index,
                currentImageBase64,
                ...initialState,
            }));
        };
    }

    changeText = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.currentTarget;
        if (name === 'toptext') {
            this.setState({ topText: value });
        } else if (name === 'bottomtext') {
            this.setState({ bottomText: value });
        }
    }

    getStateObj = (
        e: React.MouseEvent<SVGTextElement>,
        type: 'top' | 'bottom'
    ): (
        | Pick<MemeMakerState, 'isTopDragging' | 'isBottomDragging' | 'topX' | 'topY'>
        | Pick<MemeMakerState, 'isTopDragging' | 'isBottomDragging' | 'bottomX' | 'bottomY'>
        | {}
    ) => {
        if (!this.imageRef.current) {
            return {};
        }
        const svgElement = this.imageRef.current.ownerSVGElement;
        if (!svgElement) {
            return {};
        }
        const rect = svgElement.getBoundingClientRect();
        const xOffset = e.clientX - rect.left;
        const yOffset = e.clientY - rect.top;
        if (type === "bottom") {
            return this.getBottomStateObj(xOffset, yOffset);
        } else if (type === "top") {
            return this.getTopStateObj(xOffset, yOffset);
        }
        return {};
    }

    private onDocumentMouseMove: ((ev: MouseEvent) => void) | null = null;
    private onDocumentMouseUp: ((ev: MouseEvent) => void) | null = null;

    handleMouseDown = (e: React.MouseEvent<SVGTextElement>, type: 'top' | 'bottom') => {
        if (!this.imageRef.current) return;
        const svgElement = this.imageRef.current.ownerSVGElement;
        if (!svgElement) return;
        const rect = svgElement.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const parsePos = (value: string, size: number) => {
            if (value.endsWith('%')) {
                const pct = parseFloat(value);
                return (isNaN(pct) ? 50 : pct) * size / 100;
            }
            if (value.endsWith('px')) {
                const px = parseFloat(value);
                return isNaN(px) ? size / 2 : px;
            }
            return size / 2;
        };

        if (type === 'top') {
            const currentX = parsePos(this.state.topX, rect.width);
            const currentY = parsePos(this.state.topY, rect.height);
            this.topDragOffsetX = cursorX - currentX;
            this.topDragOffsetY = cursorY - currentY;
            this.setState({
                isTopDragging: true,
                isBottomDragging: false,
            });
        } else {
            const currentX = parsePos(this.state.bottomX, rect.width);
            const currentY = parsePos(this.state.bottomY, rect.height);
            this.bottomDragOffsetX = cursorX - currentX;
            this.bottomDragOffsetY = cursorY - currentY;
            this.setState({
                isTopDragging: false,
                isBottomDragging: true,
            });
        }

        this.onDocumentMouseMove = (ev: MouseEvent) => {
            if (!this.state.isTopDragging && !this.state.isBottomDragging) return;

            const svgElement = this.imageRef.current?.ownerSVGElement;
            if (!svgElement) return;
            const rect = svgElement.getBoundingClientRect();
            const xOffset = ev.clientX - rect.left;
            const yOffset = ev.clientY - rect.top;

            let moveObj: Partial<MemeMakerState> = {};
            if (this.state.isTopDragging) {
                const newX = xOffset - this.topDragOffsetX;
                const newY = yOffset - this.topDragOffsetY;
                moveObj = {
                    topX: `${newX}px`,
                    topY: `${newY}px`,
                };
            } else if (this.state.isBottomDragging) {
                const newX = xOffset - this.bottomDragOffsetX;
                const newY = yOffset - this.bottomDragOffsetY;
                moveObj = {
                    bottomX: `${newX}px`,
                    bottomY: `${newY}px`,
                };
            }

            // TS can't reconcile the union of two different Pick<> shapes here; runtime is safe.
            this.setState(moveObj as any);
        };
        document.addEventListener('mousemove', this.onDocumentMouseMove);
        this.onDocumentMouseUp = () => {
            this.handleMouseUp({} as React.MouseEvent<SVGTextElement>);
        };
        document.addEventListener('mouseup', this.onDocumentMouseUp);
    }

    handleMouseUp = (_e: React.MouseEvent<SVGTextElement>, _type?: 'top' | 'bottom') => {
        if (this.onDocumentMouseMove) {
            document.removeEventListener('mousemove', this.onDocumentMouseMove);
            this.onDocumentMouseMove = null;
        }
        if (this.onDocumentMouseUp) {
            document.removeEventListener('mouseup', this.onDocumentMouseUp);
            this.onDocumentMouseUp = null;
        }
        this.setState({
            isTopDragging: false,
            isBottomDragging: false
        });
    }

    convertSvgToImage = () => {
        const backgroundSrc = this.state.currentImageBase64;
        if (!backgroundSrc) return;

        (document as any).fonts?.ready?.then(() => {
            const svg = this.svgRef.current;
            const vb = svg?.viewBox?.baseVal;
            const exportWidth = (vb && vb.width) ? vb.width : undefined;
            const exportHeight = (vb && vb.height) ? vb.height : undefined;

            const canvas = document.createElement('canvas');

            const img = new Image();
            img.src = backgroundSrc;
            img.onload = () => {
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const finalW = exportWidth ?? img.naturalWidth ?? 600;
                const finalH = exportHeight ?? img.naturalHeight ?? 600;
                canvas.width = finalW;
                canvas.height = finalH;

                // Draw background image to fill canvas
                ctx.drawImage(img, 0, 0, finalW, finalH);

                // Helper to convert state positions (%, px) into absolute coords
                const parsePos = (value: string, size: number) => {
                    if (value.endsWith('%')) {
                        const pct = parseFloat(value);
                        return (isNaN(pct) ? 50 : pct) * size / 100;
                    }
                    if (value.endsWith('px')) {
                        const px = parseFloat(value);
                        return isNaN(px) ? size / 2 : px;
                    }
                    return size / 2;
                };

                const topX = parsePos(this.state.topX, finalW);
                const topY = parsePos(this.state.topY, finalH);
                const bottomX = parsePos(this.state.bottomX, finalW);
                const bottomY = parsePos(this.state.bottomY, finalH);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.lineJoin = 'round';
                ctx.font = '700 48px "Impact Regular", system-ui, sans-serif';

                ctx.lineWidth = 4;
                ctx.strokeStyle = '#000000';
                ctx.fillStyle = '#ffffff';
                if (this.state.topText) {
                    ctx.strokeText(this.state.topText, topX, topY);
                    ctx.fillText(this.state.topText, topX, topY);
                }

                if (this.state.bottomText) {
                    ctx.strokeText(this.state.bottomText, bottomX, bottomY);
                    ctx.fillText(this.state.bottomText, bottomX, bottomY);
                }

                const canvasdata = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.download = 'meme.png';
                a.href = canvasdata;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        });
    }


    render() {
        // Calculate dimensions for the modal image
        const image = photos[this.state.currentImage];
        const base_image = new Image();
        base_image.src = image.src;
        // Default dimensions if image hasn't loaded yet
        const defaultWidth = 600;
        const defaultHeight = 400;
        const wrh = base_image.width && base_image.height 
            ? base_image.width / base_image.height 
            : defaultWidth / defaultHeight;
        const newWidth = defaultWidth;
        const newHeight = base_image.width && base_image.height 
            ? newWidth / wrh 
            : defaultHeight;

        const textStyle: React.CSSProperties = {
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 1.5,
            paintOrder: 'stroke fill',
            strokeLinejoin: 'round',
            fontSize: '48px',
            fontWeight: 700,
            fontFamily: "'Impact Regular', system-ui, sans-serif",
            userSelect: 'none',
            cursor: 'move'
        };

        return (
            <div className="meme-content">
                <div className="meme-editor">
                    <div
                        className="meme-svg-wrap"
                        style={{ aspectRatio: `${newWidth} / ${newHeight}` }}
                    >
                        <svg
                            ref={this.svgRef}
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${newWidth} ${newHeight}`}
                            preserveAspectRatio="xMidYMid meet"
                            xmlns="http://www.w3.org/1999/xlink"
                        >
                            <image
                                ref={this.imageRef}
                                xlinkHref={this.state.currentImageBase64 || undefined}
                                height={newHeight}
                                width={newWidth}
                            />
                            <text
                                style={textStyle}
                                x={this.state.topX}
                                y={this.state.topY}
                                dominantBaseline="middle"
                                textAnchor="middle"
                                onMouseDown={(event) => this.handleMouseDown(event, 'top')}
                                onMouseUp={(event) => this.handleMouseUp(event, 'top')}
                            >
                                {this.state.topText}
                            </text>
                            <text
                                style={textStyle}
                                dominantBaseline="middle"
                                textAnchor="middle"
                                x={this.state.bottomX}
                                y={this.state.bottomY}
                                onMouseDown={(event) => this.handleMouseDown(event, 'bottom')}
                                onMouseUp={(event) => this.handleMouseUp(event, 'bottom')}
                            >
                                {this.state.bottomText}
                            </text>
                        </svg>
                    </div>
                    <div className="meme-form">
                        <FormGroup>
                            <Label for="toptext">Top Text</Label>
                            <input
                                className="form-control"
                                type="text"
                                name="toptext"
                                id="toptext"
                                placeholder="Add text to the top"
                                onChange={this.changeText}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="bottomtext">Bottom Text</Label>
                            <input
                                className="form-control"
                                type="text"
                                name="bottomtext"
                                id="bottomtext"
                                placeholder="Add text to the bottom"
                                onChange={this.changeText}
                            />
                        </FormGroup>
                        <button
                            onClick={() => this.convertSvgToImage()}
                            className="btn btn-primary"
                        >
                            Download Image
                        </button>
                    </div>
                </div>

                <div className="meme-notes">
                    <h2 className="meme-notes-title">To-do list</h2>
                    <ul className="meme-notes-list">
                        <li>Better Customization of text</li>
                        <li>Custom Image Upload</li>
                        <li>Better UI</li>
                    </ul>
                </div>
            </div>
            

        )
    }
}

export default MemeMaker;